export const sendOtpEmail = async (email: string, otp: string, purpose: 'verify' | 'reset'): Promise<boolean> => {
  console.log('\n=========================================');
  console.log(`📩  [MOCK MAIL SERVICE] To: ${email}`);
  console.log(`📧  Subject: Compass.ai - OTP for ${purpose === 'verify' ? 'Email Verification' : 'Password Reset'}`);
  console.log(`🔑  Verification Code: ${otp}`);
  console.log('=========================================\n');
  return true;
};
