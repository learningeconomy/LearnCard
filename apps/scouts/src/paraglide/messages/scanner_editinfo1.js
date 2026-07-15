/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Editinfo1Inputs */

const en_scanner_editinfo1 = /** @type {(inputs: Scanner_Editinfo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Info`)
};

const es_scanner_editinfo1 = /** @type {(inputs: Scanner_Editinfo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Info`)
};

const fr_scanner_editinfo1 = /** @type {(inputs: Scanner_Editinfo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les infos`)
};

const ar_scanner_editinfo1 = /** @type {(inputs: Scanner_Editinfo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Info`)
};

/**
* | output |
* | --- |
* | "Edit Info" |
*
* @param {Scanner_Editinfo1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_editinfo1 = /** @type {((inputs?: Scanner_Editinfo1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Editinfo1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_editinfo1(inputs)
	if (locale === "es") return es_scanner_editinfo1(inputs)
	if (locale === "fr") return fr_scanner_editinfo1(inputs)
	return ar_scanner_editinfo1(inputs)
});
export { scanner_editinfo1 as "scanner.editInfo" }