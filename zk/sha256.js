const snarkjs = require("snarkjs")
const fs = require("fs")
const BN = require('bn.js')
const BigNumber = require('bignumber.js');

async function run() {
    let str = 'ab'
    let arr = stringToBinary(str, 256)
    //0110000101100010
    console.log('0x' + new BigNumber(binaryToString(arr), 2).toString(16))
    console.log('str2bin', str2bin(str, true));

    const { proof, publicSignals } = await snarkjs.groth16.fullProve({in:arr}, "main.wasm", "circuit_final.zkey");

    console.log("publicSignals: ", new BigNumber(binaryToString(publicSignals), 2).toString(16));
    console.log("Proof: ");
    console.log(JSON.stringify(proof, null, 1));

    const vKey = JSON.parse(fs.readFileSync("verification_key.json"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (res === true) {
        console.log("Verification OK");
    } else {
        console.log("Invalid proof");
    }
}


function stringToBinary(string, bits) {
    let binStr = '';
    let resultArray = [];

    for (let i = 0; i < string.length; i++) {
        let compact = string.charCodeAt(i).toString(2)
        binStr += '0'
        binStr += compact
    }
    console.log(binStr)

    for (i = 0; i < binStr.length; i++) {
        let bit = binStr.charCodeAt(i).toString(10)
        if (bit == '49') {
            resultArray.push(1)
        } else {
            resultArray.push(0)
        }
    }

    while (resultArray.length < bits) {
        resultArray.unshift(0)
    }

    console.log(resultArray.length, resultArray)
    return resultArray
}


function binaryToString(arr) {
    let binStr = '';
    let resultArray = [];

    for (let i = 0; i < arr.length; i++) {
        binStr += arr[i].toString()
    }
    console.log(binStr)

    return binStr
}



/**
 * 字符串转 utf-8 二进制
 *
 * UTF-8 是一种变长的编码方式。它可以使用1~4个字节表示一个符号，根据不同的符号而变化字节长度。
 * 两条规则：
 * 1）对于单字节的符号，字节的第一位设为0，后面7位为这个符号的 Unicode 码。因此对于英语字母，UTF-8 编码和 ASCII 码是相同的。
 * 2）对于n字节的符号（n > 1），第一个字节的前n位都设为1，第n + 1位设为0，后面字节的前两位一律设为10。剩下的没有提及的二进制位，全部为这个符号的 Unicode 码。
 * @param str
 */
 function str2bin(str, byByte = false) {
    let str_arr = new Array(4);
    let unicode_num, bin_arr = new Array();
    for (let i = 0; i < str.length; i++) {
        str_arr.fill('');
        unicode_num = str.charCodeAt(i);

        // 十六进制范围：00000000 ~ 0000007F
        // 二进制范围：0 ~ 2^7-1
        // 格式：0xxxxxxx
        if (unicode_num < 128) {
            str_arr[0] = pad_zero(unicode_num.toString(2), 8);
        }
        // 00000080 ~ 000007FF
        // 2^7 ~ 2^11-1
        // 格式：110xxxxx 10xxxxxx
        else if (unicode_num >= 128 && unicode_num < 2048) {
            // 第一字节 110xxxxx
            //1. 右移6位, 即去掉右边6位
            //2. 填充到 110xxxxx, 即设置7位和6位为1, 1100000 = 2^7 + 2^6 = 128 + 64 = 192
            str_arr[0] = ((unicode_num >> 6) | 192).toString(2);
            // 第二字节 10xxxxxx
            //1. 先取后6位, 63 = 64 - 1 = 2^6 - 1 = 1000000 - 1 = 111111
            //2. 填充到 10xxxxxx 中, 1000000 = 2^7 = 128, a | 128 即设置a的7位为1，其他保持不变
            str_arr[1] = ((unicode_num & 63) | 128).toString(2);
        }
        // 00000800 ~ 0000FFFF
        // 2^11 ~ 2^16-1
        // 格式：1110xxxx 10xxxxxx 10xxxxxx
        else if (unicode_num >= 128 && unicode_num < 65536) {
            // 第一字节
            // 1.右移12位
            // 2.填充到 1110xxxx, 11100000 = 2^7 + 2^6 + 2^5 = 224
            str_arr[0] = ((unicode_num >> 12) | 224).toString(2);

            // 第二字节 - 取中间6位
            // 1.右移6位
            // 2.取后6位
            // 3.填充到 10xxxxxx
            str_arr[1] = (((unicode_num >> 6) & 63) | 128).toString(2);

            // 第三字节 - 取后6位
            str_arr[2] = ((unicode_num & 63) | 128).toString(2);
        }
        // 00010000 ~ 0010FFFF
        // 2^16 ~ (2^17 + 2^16 - 1)
        // 65536 ~ 196607
        // 格式：11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
        else {
            // 第一字节
            // 1.右移18位
            // 2.填充到 11110xxx, 11110000 = 2^7 + 2^6 + 2^5 + 2^4 = 240
            str_arr[0] = ((unicode_num >> 18) | 240).toString(2);

            str_arr[1] = (((unicode_num >> 12) & 63) | 128).toString(2);
            str_arr[2] = (((unicode_num >> 6) & 63) | 128).toString(2);
            str_arr[3] = ((unicode_num & 63) | 128).toString(2);

        }

        // 按字节返回 或 按字符返回
        if (byByte) {
            bin_arr = bin_arr.concat(str_arr.filter(item => {
                return item.length > 0;
            }));
        } else {
            bin_arr.push(str_arr.join(''));
        }
    }

    return bin_arr;
}

/**
 * 填充0
 * @param input
 * @param pad_len
 * @param pad_type 0:左填充 1:右填充
 * @returns {number|string|number}
 */
function pad_zero(input, pad_len, pad_type = 0) {
    if (typeof input == 'number') {
        input += '';
    }

    let str_len = input.length;
    if (str_len >= pad_len) {
        return input;
    }

    for (let i = 0; i < pad_len - str_len; i++) {
        if (pad_type) {
            input += '0';
        } else {
            input = '0' + input;
        }
    }

    return input;
}


run().then(() => {
    process.exit(0);
});