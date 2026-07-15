/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Memberdisplay4Inputs */

const en_boostcms_memberdisplay4 = /** @type {(inputs: Boostcms_Memberdisplay4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member Display`)
};

const es_boostcms_memberdisplay4 = /** @type {(inputs: Boostcms_Memberdisplay4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visualización de Miembros`)
};

const fr_boostcms_memberdisplay4 = /** @type {(inputs: Boostcms_Memberdisplay4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Affichage des membres`)
};

const ar_boostcms_memberdisplay4 = /** @type {(inputs: Boostcms_Memberdisplay4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member Display`)
};

/**
* | output |
* | --- |
* | "Member Display" |
*
* @param {Boostcms_Memberdisplay4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_memberdisplay4 = /** @type {((inputs?: Boostcms_Memberdisplay4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Memberdisplay4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_memberdisplay4(inputs)
	if (locale === "es") return es_boostcms_memberdisplay4(inputs)
	if (locale === "fr") return fr_boostcms_memberdisplay4(inputs)
	return ar_boostcms_memberdisplay4(inputs)
});
export { boostcms_memberdisplay4 as "boostCMS.memberDisplay" }