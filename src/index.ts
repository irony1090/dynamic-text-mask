import * as DynamicTextMask from "./dynamic_text_mask";
export default DynamicTextMask;

// console.log(
//   DynamicTextMask.telMask.parse('+82 01082360642')
// )

console.log(
  DynamicTextMask.emailMask.parse('strike')
)

console.log(
  DynamicTextMask.emailMask.parse('strike@')
)

console.log(
  DynamicTextMask.emailMask.parse('strike9109.01@google.com')
)

console.log(
  DynamicTextMask.emailMask.parse('strike_-123@naver.co.kr')
)

