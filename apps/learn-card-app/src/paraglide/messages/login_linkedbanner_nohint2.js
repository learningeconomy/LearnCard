/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Linkedbanner_Nohint2Inputs */

const en_login_linkedbanner_nohint2 = /** @type {(inputs: Login_Linkedbanner_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Device linked — sign in to finish`)
};

const es_login_linkedbanner_nohint2 = /** @type {(inputs: Login_Linkedbanner_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dispositivo vinculado — inicia sesión para terminar`)
};

const fr_login_linkedbanner_nohint2 = /** @type {(inputs: Login_Linkedbanner_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appareil lié — connectez-vous pour terminer`)
};

const ar_login_linkedbanner_nohint2 = /** @type {(inputs: Login_Linkedbanner_Nohint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم ربط الجهاز — سجل الدخول للإنهاء`)
};

/**
* | output |
* | --- |
* | "Device linked — sign in to finish" |
*
* @param {Login_Linkedbanner_Nohint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_linkedbanner_nohint2 = /** @type {((inputs?: Login_Linkedbanner_Nohint2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Linkedbanner_Nohint2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_linkedbanner_nohint2(inputs)
	if (locale === "es") return es_login_linkedbanner_nohint2(inputs)
	if (locale === "fr") return fr_login_linkedbanner_nohint2(inputs)
	return ar_login_linkedbanner_nohint2(inputs)
});
export { login_linkedbanner_nohint2 as "login.linkedBanner.noHint" }