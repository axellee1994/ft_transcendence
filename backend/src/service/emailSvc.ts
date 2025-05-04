import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const send2FACode = async (recipientEmail: string, code: number) =>
{
    const mailOptions = 
    {
        from: `"No Reply" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: '2FA - One Time Passcode',
        text: `Your 2FA One Time Passcode is: ${code}. Expired in 5 mins.`,
        html: `<p>Your 2FA One Time Passcode is: <strong>${code}</strong>. Expired in 5 mins.</p>`
    };

    try 
    {
        await transporter.sendMail(mailOptions);
    } 
    catch (error) 
    {
        console.error('Error sending 2FA email:', error);
        throw error;
    }
}
