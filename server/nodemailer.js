const nodemailer = require("nodemailer");
const { EMAIL_USER, ENV_PASSWORD } = require('./server_config')

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
//   let testAccount = await nodemailer.createTestAccount();


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: EMAIL_USER,
        pass: ENV_PASSWORD
    }
});

// verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
    console.log("Mailer error :",error);
    } else {
    console.log("Nodemailer is ready to take our messages");
    }
});

const sendEmail = async (payload, url) => {
    // send mail with defined transport object
    console.info("new url",url)
    let info = await transporter.sendMail({
        from: '"FSD 2020 👻" <myfsdtesting@gmail.com>', // sender address
        to: payload.email, // list of receivers
        subject: "Reset your password", // Subject line
        text: `Hello ${payload.name}, you can reset ${payload.username} password by clicking this link ${url}, link will last 5 minutes.`, // plain text body
        html: '<p>Hello <b>' + (payload.name || payload.username) + '</b>, <br><br> You can reset password for ' + payload.username + ' by clicking this link <a href="' + url + '">Reset Password</a></p><br>Link will last 5 minutes.', // html text body
    });

    console.log("Message sent: %s", info.messageId);
}

module.exports = {
    sendEmail
}
