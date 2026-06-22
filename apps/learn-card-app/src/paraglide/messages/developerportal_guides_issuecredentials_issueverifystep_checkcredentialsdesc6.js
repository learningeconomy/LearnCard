/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`After running your code, click below to check if the credential was sent successfully.`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Después de ejecutar tu código, haz clic abajo para verificar si la credencial se envió correctamente.`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Après avoir exécuté votre code, cliquez ci-dessous pour vérifier si le certificat a été envoyé avec succès.`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعد تشغيل الكود الخاص بك، انقر أدناه للتحقق مما إذا تم إرسال المؤهل بنجاح.`)
};

/**
* | output |
* | --- |
* | "After running your code, click below to check if the credential was sent successfully." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Checkcredentialsdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_checkcredentialsdesc6 as "developerPortal.guides.issueCredentials.issueVerifyStep.checkCredentialsDesc" }