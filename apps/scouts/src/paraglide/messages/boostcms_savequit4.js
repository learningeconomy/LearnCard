/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Savequit4Inputs */

const en_boostcms_savequit4 = /** @type {(inputs: Boostcms_Savequit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save & Quit`)
};

const es_boostcms_savequit4 = /** @type {(inputs: Boostcms_Savequit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar y Salir`)
};

const fr_boostcms_savequit4 = /** @type {(inputs: Boostcms_Savequit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarder et quitter`)
};

const ar_boostcms_savequit4 = /** @type {(inputs: Boostcms_Savequit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ وإنهاء`)
};

/**
* | output |
* | --- |
* | "Save & Quit" |
*
* @param {Boostcms_Savequit4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_savequit4 = /** @type {((inputs?: Boostcms_Savequit4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Savequit4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_savequit4(inputs)
	if (locale === "es") return es_boostcms_savequit4(inputs)
	if (locale === "fr") return fr_boostcms_savequit4(inputs)
	return ar_boostcms_savequit4(inputs)
});
export { boostcms_savequit4 as "boostCMS.saveQuit" }