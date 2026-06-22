/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Login_Welcome_HeadingInputs */

const en_login_welcome_heading = /** @type {(inputs: Login_Welcome_HeadingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Welcome to ${i?.brand}`)
};

const es_login_welcome_heading = /** @type {(inputs: Login_Welcome_HeadingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Bienvenido a ${i?.brand}`)
};

const fr_login_welcome_heading = /** @type {(inputs: Login_Welcome_HeadingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Bienvenue sur ${i?.brand}`)
};

const ar_login_welcome_heading = /** @type {(inputs: Login_Welcome_HeadingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`مرحباً بك في ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "Welcome to {brand}" |
*
* @param {Login_Welcome_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_welcome_heading = /** @type {((inputs: Login_Welcome_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Welcome_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_welcome_heading(inputs)
	if (locale === "es") return es_login_welcome_heading(inputs)
	if (locale === "fr") return fr_login_welcome_heading(inputs)
	return ar_login_welcome_heading(inputs)
});
export { login_welcome_heading as "login.welcome.heading" }