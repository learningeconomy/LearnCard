/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Publicmembers4Inputs */

const en_boostcms_publicmembers4 = /** @type {(inputs: Boostcms_Publicmembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicly display members`)
};

const es_boostcms_publicmembers4 = /** @type {(inputs: Boostcms_Publicmembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar miembros públicamente`)
};

const fr_boostcms_publicmembers4 = /** @type {(inputs: Boostcms_Publicmembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher les membres publiquement`)
};

const ar_boostcms_publicmembers4 = /** @type {(inputs: Boostcms_Publicmembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الأعضاء للجمهور`)
};

/**
* | output |
* | --- |
* | "Publicly display members" |
*
* @param {Boostcms_Publicmembers4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_publicmembers4 = /** @type {((inputs?: Boostcms_Publicmembers4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Publicmembers4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_publicmembers4(inputs)
	if (locale === "es") return es_boostcms_publicmembers4(inputs)
	if (locale === "fr") return fr_boostcms_publicmembers4(inputs)
	return ar_boostcms_publicmembers4(inputs)
});
export { boostcms_publicmembers4 as "boostCMS.publicMembers" }