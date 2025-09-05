# flake8: noqa

if __import__("typing").TYPE_CHECKING:
    # import apis into api package
    from openapi_client.api.auth_grants_api import AuthGrantsApi
    from openapi_client.api.boosts_api import BoostsApi
    from openapi_client.api.claim_hooks_api import ClaimHooksApi
    from openapi_client.api.contact_methods_api import ContactMethodsApi
    from openapi_client.api.contracts_api import ContractsApi
    from openapi_client.api.credentials_api import CredentialsApi
    from openapi_client.api.did_metadata_api import DIDMetadataApi
    from openapi_client.api.presentations_api import PresentationsApi
    from openapi_client.api.profile_managers_api import ProfileManagersApi
    from openapi_client.api.profiles_api import ProfilesApi
    from openapi_client.api.storage_api import StorageApi
    from openapi_client.api.universal_inbox_api import UniversalInboxApi
    from openapi_client.api.utilities_api import UtilitiesApi
    from openapi_client.api.vcapi_api import VCAPIApi
    from openapi_client.api.workflows_api import WorkflowsApi
    
else:
    from lazy_imports import LazyModule, as_package, load

    load(
        LazyModule(
            *as_package(__file__),
            """# import apis into api package
from openapi_client.api.auth_grants_api import AuthGrantsApi
from openapi_client.api.boosts_api import BoostsApi
from openapi_client.api.claim_hooks_api import ClaimHooksApi
from openapi_client.api.contact_methods_api import ContactMethodsApi
from openapi_client.api.contracts_api import ContractsApi
from openapi_client.api.credentials_api import CredentialsApi
from openapi_client.api.did_metadata_api import DIDMetadataApi
from openapi_client.api.presentations_api import PresentationsApi
from openapi_client.api.profile_managers_api import ProfileManagersApi
from openapi_client.api.profiles_api import ProfilesApi
from openapi_client.api.storage_api import StorageApi
from openapi_client.api.universal_inbox_api import UniversalInboxApi
from openapi_client.api.utilities_api import UtilitiesApi
from openapi_client.api.vcapi_api import VCAPIApi
from openapi_client.api.workflows_api import WorkflowsApi

""",
            name=__name__,
            doc=__doc__,
        )
    )
