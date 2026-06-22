/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Ids1Inputs */

const en_wallet_categorydescriptor_descriptions_ids1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IDs are essential digital or physical credentials used to verify an individual's identity in various contexts. They provide a secure way to store and access personal identification information, enabling access to services, facilities, or systems that require user authentication. Whether used for logging into platforms, verifying age, or gaining entry to secure areas, IDs are a fundamental tool in ensuring privacy, security, and convenience across different domains.`)
};

const es_wallet_categorydescriptor_descriptions_ids1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las identificaciones son credenciales digitales o físicas esenciales que se utilizan para verificar la identidad de una persona en diversos contextos. Proporcionan una forma segura de almacenar y acceder a la información de identificación personal, permitiendo el acceso a servicios, instalaciones o sistemas que requieren autenticación del usuario. Ya sea para iniciar sesión en plataformas, verificar la edad o acceder a zonas seguras, las identificaciones son una herramienta fundamental para garantizar la privacidad, la seguridad y la comodidad en distintos ámbitos.`)
};

const fr_wallet_categorydescriptor_descriptions_ids1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les pièces d'identité sont des justificatifs numériques ou physiques essentiels servant à vérifier l'identité d'une personne dans divers contextes. Elles offrent un moyen sécurisé de stocker et de consulter les informations d'identification personnelles, permettant l'accès à des services, des installations ou des systèmes nécessitant une authentification de l'utilisateur. Qu'il s'agisse de se connecter à des plateformes, de vérifier l'âge ou d'accéder à des zones sécurisées, les pièces d'identité sont un outil fondamental pour garantir la confidentialité, la sécurité et la commodité dans différents domaines.`)
};

const ar_wallet_categorydescriptor_descriptions_ids1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الهويّات هي بيانات اعتماد رقمية أو مادية أساسية تُستخدم للتحقق من هوية الفرد في سياقات مختلفة. وهي توفّر طريقة آمنة لتخزين معلومات الهوية الشخصية والوصول إليها، ما يتيح الوصول إلى الخدمات أو المرافق أو الأنظمة التي تتطلب مصادقة المستخدم. وسواء استُخدمت لتسجيل الدخول إلى المنصات أو التحقق من العمر أو الدخول إلى المناطق الآمنة، فإن الهويّات أداة أساسية لضمان الخصوصية والأمان والراحة في مختلف المجالات.`)
};

/**
* | output |
* | --- |
* | "IDs are essential digital or physical credentials used to verify an individual's identity in various contexts. They provide a secure way to store and access ..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Ids1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_ids1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Ids1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Ids1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_ids1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_ids1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_ids1(inputs)
	return ar_wallet_categorydescriptor_descriptions_ids1(inputs)
});
export { wallet_categorydescriptor_descriptions_ids1 as "wallet.categoryDescriptor.descriptions.ids" }