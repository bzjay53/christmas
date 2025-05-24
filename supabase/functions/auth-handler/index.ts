import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SignupData {
  email: string
  firstName: string
  lastName: string
  referralCode?: string
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { method } = req
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (method) {
      case 'POST':
        if (action === 'signup-complete') {
          return await handleSignupComplete(req, supabase)
        } else if (action === 'apply-referral') {
          return await handleReferralReward(req, supabase)
        }
        break
      
      case 'GET':
        if (action === 'validate-referral') {
          return await handleValidateReferral(req, supabase)
        }
        break
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleSignupComplete(req: Request, supabase: any) {
  const { userId, email, firstName, lastName, referralCode }: SignupData & { userId: string } = await req.json()

  try {
    // 1. 사용자 프로필 생성/업데이트
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    let userProfile
    if (existingUser) {
      // 기존 사용자 업데이트
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          referred_by: referralCode || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      userProfile = data
    } else {
      // 새 사용자 생성
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          referred_by: referralCode || null,
          membership_type: 'free'
        })
        .select()
        .single()

      if (error) throw error
      userProfile = data
    }

    // 2. 초대 코드 처리
    let referralReward = null
    if (referralCode) {
      try {
        // 초대 코드 검증
        const { data: referralData, error: referralError } = await supabase
          .from('referral_codes')
          .select('user_id, code, is_active, expires_at, current_uses, max_uses')
          .eq('code', referralCode.toUpperCase())
          .eq('is_active', true)
          .single()

        if (referralError) {
          console.log('초대 코드 검증 실패:', referralError)
        } else if (referralData) {
          // 만료 확인
          if (new Date(referralData.expires_at) > new Date() && 
              referralData.current_uses < referralData.max_uses) {
            
            // 초대 보상 생성
            const { data: reward, error: rewardError } = await supabase
              .from('referral_rewards')
              .insert({
                inviter_id: referralData.user_id,
                invitee_id: userId,
                referral_code: referralCode.toUpperCase(),
                reward_type: 'free_extension',
                reward_days: 7,
                is_verified: true,
                verification_method: 'automatic'
              })
              .select()
              .single()

            if (!rewardError) {
              referralReward = reward

              // 초대 코드 사용 횟수 증가
              await supabase
                .from('referral_codes')
                .update({
                  current_uses: referralData.current_uses + 1,
                  successful_invites: (referralData.successful_invites || 0) + 1,
                  total_reward_days: (referralData.total_reward_days || 0) + 7
                })
                .eq('code', referralCode.toUpperCase())

              // 초대자의 무료 기간 연장
              const { data: inviter } = await supabase
                .from('users')
                .select('free_trial_end_date, total_extension_days')
                .eq('id', referralData.user_id)
                .single()

              if (inviter) {
                const currentEndDate = new Date(inviter.free_trial_end_date)
                const newEndDate = new Date(currentEndDate.getTime() + (7 * 24 * 60 * 60 * 1000))
                const newExtensionDays = Math.min((inviter.total_extension_days || 0) + 7, 90)

                await supabase
                  .from('users')
                  .update({
                    free_trial_end_date: newEndDate.toISOString(),
                    total_extension_days: newExtensionDays
                  })
                  .eq('id', referralData.user_id)
              }
            }
          }
        }
      } catch (error) {
        console.log('초대 보상 처리 오류:', error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: userProfile,
        referralReward: referralReward
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Signup complete error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to complete signup', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleValidateReferral(req: Request, supabase: any) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Referral code is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select(`
        *,
        users:user_id (
          id,
          first_name,
          last_name,
          email,
          membership_type
        )
      `)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid referral code' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 만료 및 사용 횟수 확인
    const isExpired = new Date(data.expires_at) <= new Date()
    const isMaxUsed = data.current_uses >= data.max_uses

    return new Response(
      JSON.stringify({
        valid: !isExpired && !isMaxUsed,
        referralCode: data,
        inviter: data.users,
        expired: isExpired,
        maxUsed: isMaxUsed
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Validate referral error:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Failed to validate referral code' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleReferralReward(req: Request, supabase: any) {
  const { inviterId, inviteeId, referralCode } = await req.json()

  try {
    // 중복 보상 확인
    const { data: existingReward } = await supabase
      .from('referral_rewards')
      .select('id')
      .eq('inviter_id', inviterId)
      .eq('invitee_id', inviteeId)
      .single()

    if (existingReward) {
      return new Response(
        JSON.stringify({ error: 'Reward already exists for this invitation' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 보상 생성
    const { data: reward, error } = await supabase
      .from('referral_rewards')
      .insert({
        inviter_id: inviterId,
        invitee_id: inviteeId,
        referral_code: referralCode,
        reward_type: 'free_extension',
        reward_days: 7,
        is_verified: true,
        verification_method: 'automatic'
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, reward }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Apply referral reward error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to apply referral reward' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
} 