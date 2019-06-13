const { Transform } = require('stream')

class FilterAuth extends Transform {

  constructor(mipcAuth) {
    super({
      readableObjectMode: false,
      writableObjectMode: false
    })
    this.mipcAuth = mipcAuth
  }

  _transform(chunk, encoding, next) {
    const baseIdx = chunk.indexOf(this.mipcAuth.baseToken)
    if (baseIdx != -1) {
      for (let i = 0; i < this.mipcAuth.newToken.length; i++) {
        chunk[baseIdx + i] = this.mipcAuth.newToken[i]
      }
      if (chunk.indexOf(this.mipcAuth.newToken) != -1) {
         console.log('Token found and replaced');
      }
    }
    return next(null, chunk)
  }

  has(value) {
    return !!value
  }
}

module.exports = FilterAuth
