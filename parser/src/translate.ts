import translate from "@vitalets/google-translate-api";

export async function translateToKz(text: string) {
  if (!text) return "";
  const res = await translate(text, { to: "kk" });
  return res.text;
}
