/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Dateofbirth2Inputs */

const en_launchpad_detail_dateofbirth2 = /** @type {(inputs: Launchpad_Detail_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date of Birth`)
};

const es_launchpad_detail_dateofbirth2 = /** @type {(inputs: Launchpad_Detail_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de nacimiento`)
};

const fr_launchpad_detail_dateofbirth2 = /** @type {(inputs: Launchpad_Detail_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de naissance`)
};

const ar_launchpad_detail_dateofbirth2 = /** @type {(inputs: Launchpad_Detail_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الميلاد`)
};

/**
* | output |
* | --- |
* | "Date of Birth" |
*
* @param {Launchpad_Detail_Dateofbirth2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_dateofbirth2 = /** @type {((inputs?: Launchpad_Detail_Dateofbirth2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Dateofbirth2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_dateofbirth2(inputs)
	if (locale === "es") return es_launchpad_detail_dateofbirth2(inputs)
	if (locale === "fr") return fr_launchpad_detail_dateofbirth2(inputs)
	return ar_launchpad_detail_dateofbirth2(inputs)
});
export { launchpad_detail_dateofbirth2 as "launchpad.detail.dateOfBirth" }