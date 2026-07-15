/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Savechanges2Inputs */

const en_skillframeworks_savechanges2 = /** @type {(inputs: Skillframeworks_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Changes`)
};

const es_skillframeworks_savechanges2 = /** @type {(inputs: Skillframeworks_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar Cambios`)
};

const fr_skillframeworks_savechanges2 = /** @type {(inputs: Skillframeworks_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer les modifications`)
};

const ar_skillframeworks_savechanges2 = /** @type {(inputs: Skillframeworks_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Changes`)
};

/**
* | output |
* | --- |
* | "Save Changes" |
*
* @param {Skillframeworks_Savechanges2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_savechanges2 = /** @type {((inputs?: Skillframeworks_Savechanges2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Savechanges2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_savechanges2(inputs)
	if (locale === "es") return es_skillframeworks_savechanges2(inputs)
	if (locale === "fr") return fr_skillframeworks_savechanges2(inputs)
	return ar_skillframeworks_savechanges2(inputs)
});
export { skillframeworks_savechanges2 as "skillFrameworks.saveChanges" }