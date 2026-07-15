/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Selfsubtext1Inputs */

const en_boost_selfsubtext1 = /** @type {(inputs: Boost_Selfsubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can issue yourself credentials to tell your story. Your skills are currencies for your future.`)
};

const es_boost_selfsubtext1 = /** @type {(inputs: Boost_Selfsubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puedes emitirte credenciales a ti mismo para contar tu historia. Tus habilidades son moneda para tu futuro.`)
};

const fr_boost_selfsubtext1 = /** @type {(inputs: Boost_Selfsubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez vous délivrer des justificatifs pour raconter votre histoire. Vos compétences sont des monnaies d'échange pour votre avenir.`)
};

const ar_boost_selfsubtext1 = /** @type {(inputs: Boost_Selfsubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك إصدار مؤهلات لنفسك لتروي قصتك. مهاراتك هي عملة لمستقبلك.`)
};

/**
* | output |
* | --- |
* | "You can issue yourself credentials to tell your story. Your skills are currencies for your future." |
*
* @param {Boost_Selfsubtext1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_selfsubtext1 = /** @type {((inputs?: Boost_Selfsubtext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Selfsubtext1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_selfsubtext1(inputs)
	if (locale === "es") return es_boost_selfsubtext1(inputs)
	if (locale === "fr") return fr_boost_selfsubtext1(inputs)
	return ar_boost_selfsubtext1(inputs)
});
export { boost_selfsubtext1 as "boost.selfSubtext" }