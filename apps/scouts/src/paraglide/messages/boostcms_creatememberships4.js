/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Creatememberships4Inputs */

const en_boostcms_creatememberships4 = /** @type {(inputs: Boostcms_Creatememberships4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Memberships`)
};

const es_boostcms_creatememberships4 = /** @type {(inputs: Boostcms_Creatememberships4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Membresías`)
};

const fr_boostcms_creatememberships4 = /** @type {(inputs: Boostcms_Creatememberships4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des adhésions`)
};

const ar_boostcms_creatememberships4 = /** @type {(inputs: Boostcms_Creatememberships4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Memberships`)
};

/**
* | output |
* | --- |
* | "Create Memberships" |
*
* @param {Boostcms_Creatememberships4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_creatememberships4 = /** @type {((inputs?: Boostcms_Creatememberships4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Creatememberships4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_creatememberships4(inputs)
	if (locale === "es") return es_boostcms_creatememberships4(inputs)
	if (locale === "fr") return fr_boostcms_creatememberships4(inputs)
	return ar_boostcms_creatememberships4(inputs)
});
export { boostcms_creatememberships4 as "boostCMS.createMemberships" }