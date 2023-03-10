require('dotenv').config()
const request = require("request");
const twvoucher = require('@fortune-inc/tw-voucher');
const express = require('express')
const app = express()
const port = 5000


const Twitter = require('twitter-lite');
const client = new Twitter({
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token_key: process.env.access_token_key,
    access_token_secret: process.env.access_token_secret
});
console.log(process.env.name);
sendline('Start : ' + process.env.name)

let oldUrl = ["1", "2", "3", "4", "5"];

async function fortuneinc(phonenumber, voucher_code) {
    let phone_number = phonenumber.toString()
    twvoucher(phone_number, voucher_code).then(redeemed => {
        console.log(`${phone_number} : redeem ซอง ${redeemed?.code} ของ ${redeemed?.owner_full_name} จำนวน ${redeemed?.amount} บาทแล้ว`)
    }).catch(err => {
        console.error(`${phone_number} : invaild voucher code`)
        // console.log(err)
        // setTimeout(function () {
        //     againfortuneinc(phone_number, voucher_code)
        // }, 500);
    })
}


const parameters = {
    track: "gift.truemoney.com,truemoney",
    //follow: "422297024,873788249839370240",  // @OrchardAI, @tylerbuchea
    //locations: "-122.75,36.8,-121.75,37.8",  // Bounding box -	San Francisco
};

const stream = client.stream("statuses/filter", parameters)
    .on("start", response => console.log("start"))
    .on("data", tweet => {

        if (tweet?.entities?.urls[0]?.expanded_url) {

            let expanded_url = tweet.entities.urls[0].expanded_url;


            console.log(expanded_url)

            if (/gift.truemoney.com\/campaign/.test(expanded_url)) {


                let code = expanded_url.match(/([A-Za-z0-9]{14,22})/g);
                if (code) {
                    fortuneinc(process.env.tel1, code[0])
                    fortuneinc(process.env.tel2, code[0])
                    fortuneinc(process.env.tel3, code[0])
                    fortuneinc(process.env.tel4, code[0])
                }

                setTimeout(function () {
                    checknotify(expanded_url)
                }, 5000);

            }

        }
    })
    .on("ping", () => console.log("ping"))
    .on("error", error => console.log("error", error))
    .on("end", response => console.log("end"));

function checknotify(expanded_url) {
    let n = oldUrl.includes(expanded_url);
    if (n === false) {

        oldUrl.shift()
        oldUrl.push(expanded_url);

        setTimeout(function () {
            sendline(expanded_url)
        }, 5000);

    }

    setTimeout(function () {
        console.log(n)
        console.log(oldUrl)
    }, 2000);
}


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

app.get('/', (req, res) => {
    res.send('Hello World')

    // sendline('Hello World')
    // console.log(stream)
})


function sendline(text) {
    request(
        {
            method: "POST",
            uri: "https://notify-api.line.me/api/notify",
            header: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            auth: {
                bearer: process.env.line
            },
            form: {
                message: new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) + '\n\n' + process.env.name + ' :: ' + text
            }
        },
        (err, httpResponse, body) => {
            if (err) {
                console.log(err);
            } else {
                console.log(body);
            }
        }
    );
}

