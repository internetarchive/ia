class Result {
  constructor(input) {
    if (typeof input === 'object' && input.identifier !== undefined) {
      Object.assign(this, input)
    } else if (input !== '') {
      this.identifier = input
    } else {
      throw new TypeError('Result can only be used with ')
    }
  }
  metadata() {

  }
}

export default Result
