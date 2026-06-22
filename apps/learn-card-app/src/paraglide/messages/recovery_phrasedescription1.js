/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrasedescription1Inputs */

const en_recovery_phrasedescription1 = /** @type {(inputs: Recovery_Phrasedescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate a 25-word phrase that can restore your account from anywhere. Write it down and keep it safe.`)
};

const es_recovery_phrasedescription1 = /** @type {(inputs: Recovery_Phrasedescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genera una frase de 25 palabras que puede restaurar tu cuenta desde cualquier lugar. Escríbela y guárdala bien.`)
};

const fr_recovery_phrasedescription1 = /** @type {(inputs: Recovery_Phrasedescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générez une phrase de 25 mots capable de restaurer votre compte depuis n'importe où. Notez-la et gardez-la en sécurité.`)
};

const ar_recovery_phrasedescription1 = /** @type {(inputs: Recovery_Phrasedescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ عبارة من 25 كلمة يمكنها استعادة حسابك من أي مكان. اكتبها واحفظها بشكل آمن.`)
};

/**
* | output |
* | --- |
* | "Generate a 25-word phrase that can restore your account from anywhere. Write it down and keep it safe." |
*
* @param {Recovery_Phrasedescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrasedescription1 = /** @type {((inputs?: Recovery_Phrasedescription1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrasedescription1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrasedescription1(inputs)
	if (locale === "es") return es_recovery_phrasedescription1(inputs)
	if (locale === "fr") return fr_recovery_phrasedescription1(inputs)
	return ar_recovery_phrasedescription1(inputs)
});
export { recovery_phrasedescription1 as "recovery.phraseDescription" }