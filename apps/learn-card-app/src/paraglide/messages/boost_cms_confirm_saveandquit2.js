/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Confirm_Saveandquit2Inputs */

const en_boost_cms_confirm_saveandquit2 = /** @type {(inputs: Boost_Cms_Confirm_Saveandquit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save & Quit`)
};

const es_boost_cms_confirm_saveandquit2 = /** @type {(inputs: Boost_Cms_Confirm_Saveandquit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar y salir`)
};

const fr_boost_cms_confirm_saveandquit2 = /** @type {(inputs: Boost_Cms_Confirm_Saveandquit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer et quitter`)
};

const ar_boost_cms_confirm_saveandquit2 = /** @type {(inputs: Boost_Cms_Confirm_Saveandquit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ وخروج`)
};

/**
* | output |
* | --- |
* | "Save & Quit" |
*
* @param {Boost_Cms_Confirm_Saveandquit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_confirm_saveandquit2 = /** @type {((inputs?: Boost_Cms_Confirm_Saveandquit2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Confirm_Saveandquit2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_confirm_saveandquit2(inputs)
	if (locale === "es") return es_boost_cms_confirm_saveandquit2(inputs)
	if (locale === "fr") return fr_boost_cms_confirm_saveandquit2(inputs)
	return ar_boost_cms_confirm_saveandquit2(inputs)
});
export { boost_cms_confirm_saveandquit2 as "boost.cms.confirm.saveAndQuit" }