/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Connectionrequests_Description1Inputs */

const en_settings_notifications_connectionrequests_description1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When someone scans your code or clicks your user links it will initiate a network request that you can accept or deny.`)
};

const es_settings_notifications_connectionrequests_description1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando alguien escanea su código o hace clic en sus enlaces de usuario, iniciará una solicitud de red que puede aceptar o rechazar.`)
};

const fr_settings_notifications_connectionrequests_description1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lorsque quelqu'un scanne votre code ou clique sur vos liens utilisateur, une requête réseau est lancée que vous pouvez accepter ou refuser.`)
};

const ar_settings_notifications_connectionrequests_description1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عندما يقوم شخص ما بمسح الكود الخاص بك أو النقر على روابط المستخدم الخاصة بك، فإنه سيبدأ طلب شبكة يمكنك قبوله أو رفضه.`)
};

/**
* | output |
* | --- |
* | "When someone scans your code or clicks your user links it will initiate a network request that you can accept or deny." |
*
* @param {Settings_Notifications_Connectionrequests_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_connectionrequests_description1 = /** @type {((inputs?: Settings_Notifications_Connectionrequests_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Connectionrequests_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_connectionrequests_description1(inputs)
	if (locale === "es") return es_settings_notifications_connectionrequests_description1(inputs)
	if (locale === "fr") return fr_settings_notifications_connectionrequests_description1(inputs)
	return ar_settings_notifications_connectionrequests_description1(inputs)
});
export { settings_notifications_connectionrequests_description1 as "settings.notifications.connectionRequests.description" }