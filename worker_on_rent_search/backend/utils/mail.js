import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

export const sendOtpMail=async (to,otp) => {
    await transporter.sendMail({
        from:process.env.EMAIL,
        to,
        subject:"Reset Your Password",
        html:`<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
    })
}


export const sendDeliveryOtpMail=async (user,otp) => {
    await transporter.sendMail({
        from:process.env.EMAIL,
        to:user.email,
        subject:"Delivery OTP",
        html:`<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`
    })
}

// type: "start" -> given to the worker when they arrive, to begin work
//       "completion" -> given to the worker once work is done, to close out the booking
export const sendBookingOtpMail = async (email, otp, type) => {
    const subject = type === "start" ? "Work Start OTP" : "Work Completion OTP"
    const purpose = type === "start"
        ? "share this OTP with your worker once they arrive to let them start the job"
        : "share this OTP with your worker once the job is finished to mark it complete"
    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject,
        html: `<p>Your OTP is <b>${otp}</b>. ${purpose}. It expires in 15 minutes.</p>`
    })
}

// Generic transactional notification email - used for the higher-signal
// notification events (booking accepted, commission due, suspension warning...).
// Low-signal/high-frequency events (e.g. every chat message) should stay in-app only.
export const sendNotificationMail = async (email, title, message) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: title,
            html: `<p>${message}</p>`
        })
    } catch (error) {
        console.log("sendNotificationMail error", error)
    }
}

// SMS-ready architecture: no SMS provider is wired up in this build, but every
// notification flows through here so plugging in Twilio/MSG91/etc later is a
// one-function change instead of a re-plumb of every call site.
export const sendSms = async (mobile, message) => {
    console.log(`[SMS stub] would send to ${mobile}: ${message}`)
    return true
}
