export default function throttle(fn, delay, ctx) {
  let isAvail = true
  return function () {
    const args = arguments

    if (isAvail) {
      isAvail = false
      fn.apply(ctx, args)

      setTimeout(function () {
        isAvail = true
      }, delay)
    }
  }
}
