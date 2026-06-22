/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Success_Phrasesaved1Inputs */

const en_recovery_success_phrasesaved1 = /** @type {(inputs: Recovery_Success_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery phrase saved! Keep it somewhere safe.`)
};

const es_recovery_success_phrasesaved1 = /** @type {(inputs: Recovery_Success_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Frase de recuperación guardada! Guárdala en un lugar seguro.`)
};

const fr_recovery_success_phrasesaved1 = /** @type {(inputs: Recovery_Success_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase de récupération enregistrée ! Gardez-la en lieu sûr.`)
};

const ar_recovery_success_phrasesaved1 = /** @type {(inputs: Recovery_Success_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ عبارة الاسترداد! احفظها في مكان آمن.`)
};

/**
* | output |
* | --- |
* | "Recovery phrase saved! Keep it somewhere safe." |
*
* @param {Recovery_Success_Phrasesaved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_success_phrasesaved1 = /** @type {((inputs?: Recovery_Success_Phrasesaved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Success_Phrasesaved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_success_phrasesaved1(inputs)
	if (locale === "es") return es_recovery_success_phrasesaved1(inputs)
	if (locale === "fr") return fr_recovery_success_phrasesaved1(inputs)
	return ar_recovery_success_phrasesaved1(inputs)
});
export { recovery_success_phrasesaved1 as "recovery.success.phraseSaved" }