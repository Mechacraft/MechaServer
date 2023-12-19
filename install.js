const http = require('http')
const https = require('https')
const fs = require('fs')
const cp = require('child_process')

const osPlatform = 'win'
const version = '1.20.51'

function head(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'HEAD', timeout: 1000 }, resolve)
        req.on('error', reject)
        req.on('timeout', () => { req.destroy(); console.log('HEAD request timeout'); reject(new Error('timeout')) })
        req.end()
    })
}

function get(url, outPath) {
    const file = fs.createWriteStream(outPath)
    return new Promise((resolve, reject) => {
        https.get(url, { timeout: 1000 * 20 }, response => {
            if (response.statusCode !== 200) return reject(new Error('Server returned code ' + response.statusCode))
            response.pipe(file)
            file.on('finish', () => {
                file.close()
                resolve()
            })
        })
    })
}

// Get the latest versions
// TODO: once we support multi-versions
function fetchLatestUrl() {
    const url = "https://www.minecraft.net/en-us/download/server/bedrock"
    https.get(url, { timeout: 1000 * 20 }, response => {
        if (response.statusCode !== 200) return new Error('Server returned code ' + response.statusCode)
        console.log(response)
    })
}

async function download(os, version, path = 'bds-') {
    console.log('Downloading server', os, version, 'into', path)
    process.chdir(__dirname)
    const verStr = version.split('.').slice(0, 3).join('.')
    const dir = path + version

    if (fs.existsSync(dir)) {
        process.chdir(path + version) // Enter server folder
        return verStr
    }
    try { fs.mkdirSync(dir) } catch (e) { console.log(e) }

    process.chdir(path + version) // Enter server folder
    const url = (os, version) => `https://minecraft.azureedge.net/bin-${os}/bedrock-server-${version}.zip`
    let found = false

    for (let i = 0; i < 8; i++) { // Check for the latest server build for version (major.minor.patch.BUILD)
        const u = url(os, `${verStr}.${String(i).padStart(2, '0')}`)
        console.log('Opening', u, Date.now())
        let ret
        try { ret = await head(u) } catch (e) { console.log(e) }
        if (ret.statusCode === 200) {
            found = u
            console.log('Found server', ret.statusCode)
            break
        }
    }
    if (!found) throw Error('did not find server bin for ' + os + ' ' + version)
    console.info('🔻 Downloading', found)
    await get(found, 'bds.zip')
    console.info('⚡ Unzipping')
    // Unzip server
    if (process.platform === 'linux') cp.execSync('unzip -u bds.zip && chmod +777 ./bedrock_server')
    else cp.execSync('tar -xf bds.zip')
    return verStr
}

async function postInstall(os, version, path = 'bds-') {
    console.log('🔃 Preparing server', os, version)
    process.chdir(__dirname)
    const verStr = version.split('.').slice(0, 3).join('.')
    const dir = path + version

    if (!fs.existsSync(dir)) {
        process.chdir(path + version) // Enter server folder
        console.log('⚠ No installation found for ' + version)
        return
    }

    process.chdir(path + version) // Enter server folder

    const removeFiles = ['bds.zip', 'permissions.json', 'server.properties', 'allowlist.json']
    for (const file of removeFiles) {
        try {
            await fs.promises.unlink(file)
        } catch (error) {
            console.log(error)            
        }
    }

    await fs.promises.rm('config', { recursive: true, force: true })

    await fs.promises.cp(".", "..", { recursive: true, force: true });

    console.log('🎉 Server ready.', os, version)
}

download(osPlatform, version)
    .then(async(version) => {
        console.log(`Downloaded ${version} ✔`)
        await postInstall(osPlatform, version)
    })
    .catch((err) => console.error(err))