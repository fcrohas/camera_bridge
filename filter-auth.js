const { Transform } = require('stream')
const replace = require('buffer-replace')

class FilterAuth extends Transform {

  constructor(mipcAuth) {
    super({
      readableObjectMode: false,
      writableObjectMode: false
    })
    this.mipcAuth = mipcAuth
  }

  _transform(chunk, encoding, next) {
    chunk = replace(chunk, this.mipcAuth.baseToken, this.mipcAuth.newToken)
    return next(null, chunk)
  }

  has(value) {
    return !!value
  }
}

module.exports = FilterAuth
