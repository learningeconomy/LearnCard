/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Assignadmins4Inputs */

const en_boostcms_assignadmins4 = /** @type {(inputs: Boostcms_Assignadmins4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assign Admins`)
};

const es_boostcms_assignadmins4 = /** @type {(inputs: Boostcms_Assignadmins4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asignar Admins`)
};

const fr_boostcms_assignadmins4 = /** @type {(inputs: Boostcms_Assignadmins4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attribuer des administrateurs`)
};

const ar_boostcms_assignadmins4 = /** @type {(inputs: Boostcms_Assignadmins4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assign Admins`)
};

/**
* | output |
* | --- |
* | "Assign Admins" |
*
* @param {Boostcms_Assignadmins4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_assignadmins4 = /** @type {((inputs?: Boostcms_Assignadmins4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Assignadmins4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_assignadmins4(inputs)
	if (locale === "es") return es_boostcms_assignadmins4(inputs)
	if (locale === "fr") return fr_boostcms_assignadmins4(inputs)
	return ar_boostcms_assignadmins4(inputs)
});
export { boostcms_assignadmins4 as "boostCMS.assignAdmins" }