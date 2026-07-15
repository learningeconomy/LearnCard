/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Editfwopt3Inputs */

const en_skillframeworks_editfwopt3 = /** @type {(inputs: Skillframeworks_Editfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Framework`)
};

const es_skillframeworks_editfwopt3 = /** @type {(inputs: Skillframeworks_Editfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Marco`)
};

const fr_skillframeworks_editfwopt3 = /** @type {(inputs: Skillframeworks_Editfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le cadre`)
};

const ar_skillframeworks_editfwopt3 = /** @type {(inputs: Skillframeworks_Editfwopt3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Framework`)
};

/**
* | output |
* | --- |
* | "Edit Framework" |
*
* @param {Skillframeworks_Editfwopt3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_editfwopt3 = /** @type {((inputs?: Skillframeworks_Editfwopt3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Editfwopt3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_editfwopt3(inputs)
	if (locale === "es") return es_skillframeworks_editfwopt3(inputs)
	if (locale === "fr") return fr_skillframeworks_editfwopt3(inputs)
	return ar_skillframeworks_editfwopt3(inputs)
});
export { skillframeworks_editfwopt3 as "skillFrameworks.editFwOpt" }