import nodemailer from "nodemailer"

// Create reusable transporter
const createTransporter = async () => {
  // For development - using Ethereal Email
  const testAccount = await nodemailer.createTestAccount()

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

// Generate order confirmation email HTML
const generateOrderConfirmationEmail = (orderData) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Freshora Laundry</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Order Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your laundry order has been received</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Hello ${orderData.customerName}!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                Thank you for choosing Freshora Laundry! Your order has been confirmed and assigned tracking ID: <strong style="color: #667eea;">#${orderData.id}</strong>
              </p>

              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📋 Order Details</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-weight: 500; width: 120px;">Order ID:</td>
                    <td style="color: #1f2937; font-weight: 600;">#${orderData.id}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-weight: 500;">Total Amount:</td>
                    <td style="color: #1f2937; font-weight: 600;">$${orderData.totalAmount}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-weight: 500;">Status:</td>
                    <td style="color: #1f2937; font-weight: 600;">${orderData.status}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-weight: 500;">Pickup Date:</td>
                    <td style="color: #1f2937; font-weight: 600;">${orderData.pickupDate || "To be scheduled"}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-weight: 500;">Delivery Date:</td>
                    <td style="color: #1f2937; font-weight: 600;">${orderData.deliveryDate || "To be scheduled"}</td>
                  </tr>
                </table>
              </div>

              <!-- Tracking Info -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📍 Track Your Order</h3>
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                  Use your Order ID <strong>#${orderData.id}</strong> to track your order status at any time.
                </p>
              </div>

              <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                We'll keep you updated via email as your order progresses through each stage.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                © 2024 Freshora Laundry. All rights reserved.<br>
                Questions? Contact us at support@freshora.com or (555) 123-4567
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Send order confirmation email
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const transporter = await createTransporter()

    const mailOptions = {
      from: '"Freshora Laundry" <noreply@freshora.com>',
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderData.id} - Freshora Laundry`,
      html: generateOrderConfirmationEmail(orderData),
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Order confirmation email sent:", nodemailer.getTestMessageUrl(info))
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending order confirmation email:", error)
    return { success: false, error: error.message }
  }
}

// Send order status update email
export const sendOrderStatusUpdateEmail = async (orderData, newStatus) => {
  try {
    const transporter = await createTransporter()

    const statusMessages = {
      confirmed: "Your order has been confirmed and is being prepared.",
      processing: "Your order is currently being processed by our team.",
      ready_for_pickup: "Your order is ready for pickup!",
      out_for_delivery: "Your order is out for delivery.",
      completed: "Your order has been completed. Thank you for choosing Freshora Laundry!",
    }

    const mailOptions = {
      from: '"Freshora Laundry" <noreply@freshora.com>',
      to: orderData.customerEmail,
      subject: `Order Update #${orderData.id} - ${newStatus.replace("_", " ").toUpperCase()}`,
      html: `
        <h2>Order Status Update</h2>
        <p>Hello ${orderData.customerName},</p>
        <p>Your order #${orderData.id} status has been updated to: <strong>${newStatus.replace("_", " ").toUpperCase()}</strong></p>
        <p>${statusMessages[newStatus] || "Your order status has been updated."}</p>
        <p>Track your order anytime using Order ID: <strong>#${orderData.id}</strong></p>
        <p>Thank you for choosing Freshora Laundry!</p>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Status update email sent:", nodemailer.getTestMessageUrl(info))
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending status update email:", error)
    return { success: false, error: error.message }
  }
}
