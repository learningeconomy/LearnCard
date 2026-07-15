/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Memberopts4Inputs */

const en_boostcms_memberopts4 = /** @type {(inputs: Boostcms_Memberopts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member Options`)
};

const es_boostcms_memberopts4 = /** @type {(inputs: Boostcms_Memberopts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opciones de Miembros`)
};

const fr_boostcms_memberopts4 = /** @type {(inputs: Boostcms_Memberopts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Options des membres`)
};

const ar_boostcms_memberopts4 = /** @type {(inputs: Boostcms_Memberopts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member Options`)
};

/**
* | output |
* | --- |
* | "Member Options" |
*
* @param {Boostcms_Memberopts4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_memberopts4 = /** @type {((inputs?: Boostcms_Memberopts4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Memberopts4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_memberopts4(inputs)
	if (locale === "es") return es_boostcms_memberopts4(inputs)
	if (locale === "fr") return fr_boostcms_memberopts4(inputs)
	return ar_boostcms_memberopts4(inputs)
});
export { boostcms_memberopts4 as "boostCMS.memberOpts" }