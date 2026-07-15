/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Advancedsettings4Inputs */

const en_boostcms_advancedsettings4 = /** @type {(inputs: Boostcms_Advancedsettings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Settings`)
};

const es_boostcms_advancedsettings4 = /** @type {(inputs: Boostcms_Advancedsettings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración Avanzada`)
};

const fr_boostcms_advancedsettings4 = /** @type {(inputs: Boostcms_Advancedsettings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paramètres avancés`)
};

const ar_boostcms_advancedsettings4 = /** @type {(inputs: Boostcms_Advancedsettings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإعدادات المتقدمة`)
};

/**
* | output |
* | --- |
* | "Advanced Settings" |
*
* @param {Boostcms_Advancedsettings4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_advancedsettings4 = /** @type {((inputs?: Boostcms_Advancedsettings4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Advancedsettings4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_advancedsettings4(inputs)
	if (locale === "es") return es_boostcms_advancedsettings4(inputs)
	if (locale === "fr") return fr_boostcms_advancedsettings4(inputs)
	return ar_boostcms_advancedsettings4(inputs)
});
export { boostcms_advancedsettings4 as "boostCMS.advancedSettings" }