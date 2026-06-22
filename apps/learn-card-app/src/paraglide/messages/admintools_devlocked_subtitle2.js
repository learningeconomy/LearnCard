/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Devlocked_Subtitle2Inputs */

const en_admintools_devlocked_subtitle2 = /** @type {(inputs: Admintools_Devlocked_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can update your role in your account settings.`)
};

const es_admintools_devlocked_subtitle2 = /** @type {(inputs: Admintools_Devlocked_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puedes actualizar tu rol en la configuración de tu cuenta.`)
};

const fr_admintools_devlocked_subtitle2 = /** @type {(inputs: Admintools_Devlocked_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez modifier votre rôle dans les paramètres de votre compte.`)
};

const ar_admintools_devlocked_subtitle2 = /** @type {(inputs: Admintools_Devlocked_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك تحديث دورك من إعدادات حسابك.`)
};

/**
* | output |
* | --- |
* | "You can update your role in your account settings." |
*
* @param {Admintools_Devlocked_Subtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_devlocked_subtitle2 = /** @type {((inputs?: Admintools_Devlocked_Subtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Devlocked_Subtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_devlocked_subtitle2(inputs)
	if (locale === "es") return es_admintools_devlocked_subtitle2(inputs)
	if (locale === "fr") return fr_admintools_devlocked_subtitle2(inputs)
	return ar_admintools_devlocked_subtitle2(inputs)
});
export { admintools_devlocked_subtitle2 as "adminTools.devLocked.subtitle" }