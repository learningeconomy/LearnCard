/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Savedsomewheresafe2Inputs */

const en_recovery_savedsomewheresafe2 = /** @type {(inputs: Recovery_Savedsomewheresafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I've Saved It Somewhere Safe`)
};

const es_recovery_savedsomewheresafe2 = /** @type {(inputs: Recovery_Savedsomewheresafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La he guardado en un lugar seguro`)
};

const fr_recovery_savedsomewheresafe2 = /** @type {(inputs: Recovery_Savedsomewheresafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je l'ai enregistrée en lieu sûr`)
};

const ar_recovery_savedsomewheresafe2 = /** @type {(inputs: Recovery_Savedsomewheresafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد حفظتها في مكان آمن`)
};

/**
* | output |
* | --- |
* | "I've Saved It Somewhere Safe" |
*
* @param {Recovery_Savedsomewheresafe2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_savedsomewheresafe2 = /** @type {((inputs?: Recovery_Savedsomewheresafe2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Savedsomewheresafe2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_savedsomewheresafe2(inputs)
	if (locale === "es") return es_recovery_savedsomewheresafe2(inputs)
	if (locale === "fr") return fr_recovery_savedsomewheresafe2(inputs)
	return ar_recovery_savedsomewheresafe2(inputs)
});
export { recovery_savedsomewheresafe2 as "recovery.savedSomewhereSafe" }