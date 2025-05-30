/**
 * Supabase Authentication Service
 * Christmas Trading Backend
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://qehzzsxzjijfzqkysazc.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE'
);

module.exports = {
  supabase,
  
  // 사용자 검증
  async verifyUser(token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('User verification failed:', error);
      return null;
    }
  },
  
  // 사용자 정보 가져오기
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get user profile failed:', error);
      return null;
    }
  }
}; 