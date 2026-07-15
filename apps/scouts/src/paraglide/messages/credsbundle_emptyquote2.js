/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Emptyquote2Inputs */

const en_credsbundle_emptyquote2 = /** @type {(inputs: Credsbundle_Emptyquote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`"Love doesn't just sit there, like a stone, it has to be made, like bread; remade all the time, made new."`)
};

const es_credsbundle_emptyquote2 = /** @type {(inputs: Credsbundle_Emptyquote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`"El amor no se queda quieto, como una piedra; hay que hacerlo, como el pan; rehacerlo todo el tiempo, hacerlo nuevo."`)
};

const fr_credsbundle_emptyquote2 = /** @type {(inputs: Credsbundle_Emptyquote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`« L'amour ne reste pas là, comme une pierre, il doit être fait, comme du pain ; refait sans cesse, fait à nouveau. »`)
};

const ar_credsbundle_emptyquote2 = /** @type {(inputs: Credsbundle_Emptyquote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`"الحب لا يجلس مثل حجر، بل يجب صنعه مثل الخبز؛ يُصنع طوال الوقت، يُصنع من جديد."`)
};

/**
* | output |
* | --- |
* | "\"Love doesn't just sit there, like a stone, it has to be made, like bread; remade all the time, made new.\"" |
*
* @param {Credsbundle_Emptyquote2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_emptyquote2 = /** @type {((inputs?: Credsbundle_Emptyquote2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Emptyquote2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_emptyquote2(inputs)
	if (locale === "es") return es_credsbundle_emptyquote2(inputs)
	if (locale === "fr") return fr_credsbundle_emptyquote2(inputs)
	return ar_credsbundle_emptyquote2(inputs)
});
export { credsbundle_emptyquote2 as "credsBundle.emptyQuote" }