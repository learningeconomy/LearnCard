/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Autoconnect4Inputs */

const en_boostcms_autoconnect4 = /** @type {(inputs: Boostcms_Autoconnect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatically connect members in contacts`)
};

const es_boostcms_autoconnect4 = /** @type {(inputs: Boostcms_Autoconnect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar miembros automáticamente`)
};

const fr_boostcms_autoconnect4 = /** @type {(inputs: Boostcms_Autoconnect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecter automatiquement les membres dans les contacts`)
};

const ar_boostcms_autoconnect4 = /** @type {(inputs: Boostcms_Autoconnect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط الأعضاء تلقائياً في جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Automatically connect members in contacts" |
*
* @param {Boostcms_Autoconnect4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_autoconnect4 = /** @type {((inputs?: Boostcms_Autoconnect4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Autoconnect4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_autoconnect4(inputs)
	if (locale === "es") return es_boostcms_autoconnect4(inputs)
	if (locale === "fr") return fr_boostcms_autoconnect4(inputs)
	return ar_boostcms_autoconnect4(inputs)
});
export { boostcms_autoconnect4 as "boostCMS.autoConnect" }