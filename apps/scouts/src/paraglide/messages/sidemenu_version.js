/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ version: NonNullable<unknown> }} Sidemenu_VersionInputs */

const en_sidemenu_version = /** @type {(inputs: Sidemenu_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`V ${i?.version}`)
};

const es_sidemenu_version = /** @type {(inputs: Sidemenu_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`V ${i?.version}`)
};

const fr_sidemenu_version = /** @type {(inputs: Sidemenu_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`V ${i?.version}`)
};

const ar_sidemenu_version = /** @type {(inputs: Sidemenu_VersionInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`V ${i?.version}`)
};

/**
* | output |
* | --- |
* | "V {version}" |
*
* @param {Sidemenu_VersionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_version = /** @type {((inputs: Sidemenu_VersionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_VersionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_version(inputs)
	if (locale === "es") return es_sidemenu_version(inputs)
	if (locale === "fr") return fr_sidemenu_version(inputs)
	return ar_sidemenu_version(inputs)
});
export { sidemenu_version as "sidemenu.version" }