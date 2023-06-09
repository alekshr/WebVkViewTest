

export function lzw_encode(s)
{
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i = 1; i < data.length; i++)
    {
        currChar = data[i];
        if (dict[phrase + currChar] != null)
        {
            phrase += currChar;
        }
        else
        {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase = currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i = 0; i < out.length; i++)
    {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
};

export function lzw_decode(s)
{
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i = 1; i < data.length; i++)
    {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256)
        {
            phrase = data[i];
        }
        else
        {
            phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
};


export function lzw64_encode(s)
{
    if (!s) return s;
    var dict = new Map(); // Use a Map!
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i = 1; i < data.length; i++)
    {
        currChar = data[i];
        if (dict.has(phrase + currChar))
        {
            phrase += currChar;
        } else
        {
            out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
            dict.set(phrase + currChar, code);
            code++;
            if (code === 0xd800) { code = 0xe000; }
            phrase = currChar;
        }
    }
    out.push(phrase.length > 1 ? dict.get(phrase) : phrase.codePointAt(0));
    for (var i = 0; i < out.length; i++)
    {
        out[i] = String.fromCodePoint(out[i]);
    }
    //console.log ("LZW MAP SIZE", dict.size, out.slice (-50), out.length, out.join("").length);
    return out.join("");
}

export function lzw64_decode(s)
{
    var dict = new Map(); // Use a Map!
    var data = Array.from(s + "");
    //var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i = 1; i < data.length; i++)
    {
        var currCode = data[i].codePointAt(0);
        if (currCode < 256)
        {
            phrase = data[i];
        } else
        {
            phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
        }
        out.push(phrase);
        var cp = phrase.codePointAt(0);
        currChar = String.fromCodePoint(cp); //phrase.charAt(0);
        dict.set(code, oldPhrase + currChar);
        code++;
        if (code === 0xd800) { code = 0xe000; }
        oldPhrase = phrase;
    }
    return out.join("");
}

export function zip(s)
{
    try
    {
        var dict = {}
        var data = (s + '').split('')
        var out = []
        var currChar
        var phrase = data[0]
        var code = 256
        for (var i = 1; i < data.length; i++)
        {
            currChar = data[i]
            if (dict[phrase + currChar] != null)
            {
                phrase += currChar
            } else
            {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0))
                dict[phrase + currChar] = code
                code++
                phrase = currChar
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0))
        for (var j = 0; j < out.length; j++)
        {
            out[j] = String.fromCharCode(out[j])
        }
        return utoa(out.join(''))
    } catch (e)
    {
        console.log('Failed to zip string return empty string', e)
        return ''
    }
}

// Decompress an LZW-encoded base64 string
export function unzip(base64ZippedString)
{
    try
    {
        var s = atou(base64ZippedString)
        var dict = {}
        var data = (s + '').split('')
        var currChar = data[0]
        var oldPhrase = currChar
        var out = [currChar]
        var code = 256
        var phrase
        for (var i = 1; i < data.length; i++)
        {
            var currCode = data[i].charCodeAt(0)
            if (currCode < 256)
            {
                phrase = data[i]
            } else
            {
                phrase = dict[currCode] ? dict[currCode] : oldPhrase + currChar
            }
            out.push(phrase)
            currChar = phrase.charAt(0)
            dict[code] = oldPhrase + currChar
            code++
            oldPhrase = phrase
        }
        return out.join('')
    } catch (e)
    {
        console.log('Failed to unzip string return empty string', e)
        return ''
    }
}

// ucs-2 string to base64 encoded ascii
function utoa(str)
{
    return window.btoa(unescape(encodeURIComponent(str)))
}
// base64 encoded ascii to ucs-2 string
function atou(str)
{
    return decodeURIComponent(escape(window.atob(str)))
}



export function decodeHtmlEntity(str)
{
    return str.replace(/&#(\d+);/g, function (match, dec)
    {
        return String.fromCharCode(dec);
    });
};
