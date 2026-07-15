/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Updatewarning1Inputs */

const en_recovery_setup_phrase_updatewarning1 = /** @type {(inputs: Recovery_Setup_Phrase_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will generate a new phrase. Your previous phrase will no longer work.`)
};

const es_recovery_setup_phrase_updatewarning1 = /** @type {(inputs: Recovery_Setup_Phrase_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto generará una nueva frase. Tu frase anterior ya no funcionará.`)
};

const fr_recovery_setup_phrase_updatewarning1 = /** @type {(inputs: Recovery_Setup_Phrase_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela générera une nouvelle phrase. Votre phrase précédente ne fonctionnera plus.`)
};

const ar_recovery_setup_phrase_updatewarning1 = /** @type {(inputs: Recovery_Setup_Phrase_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي هذا إلى إنشاء عبارة جديدة. لن تعمل العبارة السابقة بعد الآن.`)
};

/**
* | output |
* | --- |
* | "This will generate a new phrase. Your previous phrase will no longer work." |
*
* @param {Recovery_Setup_Phrase_Updatewarning1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_updatewarning1 = /** @type {((inputs?: Recovery_Setup_Phrase_Updatewarning1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Updatewarning1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_updatewarning1(inputs)
	if (locale === "es") return es_recovery_setup_phrase_updatewarning1(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_updatewarning1(inputs)
	return ar_recovery_setup_phrase_updatewarning1(inputs)
});
export { recovery_setup_phrase_updatewarning1 as "recovery.setup.phrase.updateWarning" }