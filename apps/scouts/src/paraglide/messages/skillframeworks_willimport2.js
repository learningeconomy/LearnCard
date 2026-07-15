/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Willimport2Inputs */

const en_skillframeworks_willimport2 = /** @type {(inputs: Skillframeworks_Willimport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You will be importing:`)
};

const es_skillframeworks_willimport2 = /** @type {(inputs: Skillframeworks_Willimport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vas a importar:`)
};

const fr_skillframeworks_willimport2 = /** @type {(inputs: Skillframeworks_Willimport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous allez importer :`)
};

const ar_skillframeworks_willimport2 = /** @type {(inputs: Skillframeworks_Willimport2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You will be importing:`)
};

/**
* | output |
* | --- |
* | "You will be importing:" |
*
* @param {Skillframeworks_Willimport2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_willimport2 = /** @type {((inputs?: Skillframeworks_Willimport2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Willimport2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_willimport2(inputs)
	if (locale === "es") return es_skillframeworks_willimport2(inputs)
	if (locale === "fr") return fr_skillframeworks_willimport2(inputs)
	return ar_skillframeworks_willimport2(inputs)
});
export { skillframeworks_willimport2 as "skillFrameworks.willImport" }