/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Showmembersonly5Inputs */

const en_boostcms_showmembersonly5 = /** @type {(inputs: Boostcms_Showmembersonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show to members only`)
};

const es_boostcms_showmembersonly5 = /** @type {(inputs: Boostcms_Showmembersonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar solo a miembros`)
};

const fr_boostcms_showmembersonly5 = /** @type {(inputs: Boostcms_Showmembersonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher aux membres uniquement`)
};

const ar_boostcms_showmembersonly5 = /** @type {(inputs: Boostcms_Showmembersonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض للأعضاء فقط`)
};

/**
* | output |
* | --- |
* | "Show to members only" |
*
* @param {Boostcms_Showmembersonly5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_showmembersonly5 = /** @type {((inputs?: Boostcms_Showmembersonly5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Showmembersonly5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_showmembersonly5(inputs)
	if (locale === "es") return es_boostcms_showmembersonly5(inputs)
	if (locale === "fr") return fr_boostcms_showmembersonly5(inputs)
	return ar_boostcms_showmembersonly5(inputs)
});
export { boostcms_showmembersonly5 as "boostCMS.showMembersOnly" }