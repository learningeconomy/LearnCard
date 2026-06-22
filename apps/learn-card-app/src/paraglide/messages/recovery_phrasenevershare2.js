/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrasenevershare2Inputs */

const en_recovery_phrasenevershare2 = /** @type {(inputs: Recovery_Phrasenevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never share it — anyone with this phrase has full access`)
};

const es_recovery_phrasenevershare2 = /** @type {(inputs: Recovery_Phrasenevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nunca la compartas — cualquiera con esta frase tiene acceso completo`)
};

const fr_recovery_phrasenevershare2 = /** @type {(inputs: Recovery_Phrasenevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ne la partagez jamais — toute personne disposant de cette phrase a un accès complet`)
};

const ar_recovery_phrasenevershare2 = /** @type {(inputs: Recovery_Phrasenevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تشاركها أبدًا — أي شخص يمتلك هذه العبارة يكون لديه وصول كامل`)
};

/**
* | output |
* | --- |
* | "Never share it — anyone with this phrase has full access" |
*
* @param {Recovery_Phrasenevershare2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrasenevershare2 = /** @type {((inputs?: Recovery_Phrasenevershare2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrasenevershare2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrasenevershare2(inputs)
	if (locale === "es") return es_recovery_phrasenevershare2(inputs)
	if (locale === "fr") return fr_recovery_phrasenevershare2(inputs)
	return ar_recovery_phrasenevershare2(inputs)
});
export { recovery_phrasenevershare2 as "recovery.phraseNeverShare" }