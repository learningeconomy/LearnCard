/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Warningnevershare2Inputs */

const en_recovery_setup_phrase_warningnevershare2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningnevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never share it — anyone with this phrase has full access`)
};

const es_recovery_setup_phrase_warningnevershare2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningnevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nunca la compartas — cualquiera con esta frase tiene acceso completo`)
};

const fr_recovery_setup_phrase_warningnevershare2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningnevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ne la partagez jamais — toute personne ayant cette phrase a un accès complet`)
};

const ar_recovery_setup_phrase_warningnevershare2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningnevershare2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never share it — anyone with this phrase has full access`)
};

/**
* | output |
* | --- |
* | "Never share it — anyone with this phrase has full access" |
*
* @param {Recovery_Setup_Phrase_Warningnevershare2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_warningnevershare2 = /** @type {((inputs?: Recovery_Setup_Phrase_Warningnevershare2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Warningnevershare2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_warningnevershare2(inputs)
	if (locale === "es") return es_recovery_setup_phrase_warningnevershare2(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_warningnevershare2(inputs)
	return ar_recovery_setup_phrase_warningnevershare2(inputs)
});
export { recovery_setup_phrase_warningnevershare2 as "recovery.setup.phrase.warningNeverShare" }