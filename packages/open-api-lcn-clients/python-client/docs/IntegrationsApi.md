# openapi_client.IntegrationsApi

All URIs are relative to _/api_

| Method                                                                                                                  | HTTP request                                     | Description                       |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------- |
| [**integrations_add_integration**](IntegrationsApi.md#integrations_add_integration)                                     | **POST** /integration/create                     | Create Integration                |
| [**integrations_count_integrations**](IntegrationsApi.md#integrations_count_integrations)                               | **POST** /profile/integrations/count             | Count My Integrations             |
| [**integrations_delete_integration**](IntegrationsApi.md#integrations_delete_integration)                               | **DELETE** /integration/{id}                     | Delete Integration                |
| [**integrations_get_integration**](IntegrationsApi.md#integrations_get_integration)                                     | **GET** /integration/{id}                        | Get Integration                   |
| [**integrations_get_integration_events**](IntegrationsApi.md#integrations_get_integration_events)                       | **GET** /integration/{id}/events                 | Get Integration Events            |
| [**integrations_get_integration_webhook**](IntegrationsApi.md#integrations_get_integration_webhook)                     | **GET** /integration/{id}/webhook                | Get Integration Webhook           |
| [**integrations_get_integrations**](IntegrationsApi.md#integrations_get_integrations)                                   | **POST** /profile/integrations                   | Get My Integrations               |
| [**integrations_rotate_integration_webhook_secret**](IntegrationsApi.md#integrations_rotate_integration_webhook_secret) | **POST** /integration/{id}/webhook-secret/rotate | Rotate Integration Webhook Secret |
| [**integrations_send_integration_test_event**](IntegrationsApi.md#integrations_send_integration_test_event)             | **POST** /integration/{id}/webhook/test          | Send Integration Test Event       |
| [**integrations_set_integration_webhook**](IntegrationsApi.md#integrations_set_integration_webhook)                     | **POST** /integration/{id}/webhook               | Set Integration Webhook           |
| [**integrations_update_integration**](IntegrationsApi.md#integrations_update_integration)                               | **POST** /integration/update/{id}                | Update Integration                |

# **integrations_add_integration**

> str integrations_add_integration(integrations_add_integration_request)

Create Integration

Create a new Integration for your profile

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_add_integration_request import IntegrationsAddIntegrationRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    integrations_add_integration_request = openapi_client.IntegrationsAddIntegrationRequest() # IntegrationsAddIntegrationRequest |

    try:
        # Create Integration
        api_response = api_instance.integrations_add_integration(integrations_add_integration_request)
        print("The response of IntegrationsApi->integrations_add_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_add_integration: %s\n" % e)
```

### Parameters

| Name                                     | Type                                                                          | Description | Notes |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ----------- | ----- |
| **integrations_add_integration_request** | [**IntegrationsAddIntegrationRequest**](IntegrationsAddIntegrationRequest.md) |             |

### Return type

**str**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_count_integrations**

> float integrations_count_integrations(integrations_count_integrations_request=integrations_count_integrations_request)

Count My Integrations

Get a count of your Integrations matching a query

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_count_integrations_request import IntegrationsCountIntegrationsRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    integrations_count_integrations_request = openapi_client.IntegrationsCountIntegrationsRequest() # IntegrationsCountIntegrationsRequest |  (optional)

    try:
        # Count My Integrations
        api_response = api_instance.integrations_count_integrations(integrations_count_integrations_request=integrations_count_integrations_request)
        print("The response of IntegrationsApi->integrations_count_integrations:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_count_integrations: %s\n" % e)
```

### Parameters

| Name                                        | Type                                                                                | Description | Notes      |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | ----------- | ---------- |
| **integrations_count_integrations_request** | [**IntegrationsCountIntegrationsRequest**](IntegrationsCountIntegrationsRequest.md) |             | [optional] |

### Return type

**float**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_delete_integration**

> bool integrations_delete_integration(id)

Delete Integration

Delete an Integration by id

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |

    try:
        # Delete Integration
        api_response = api_instance.integrations_delete_integration(id)
        print("The response of IntegrationsApi->integrations_delete_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_delete_integration: %s\n" % e)
```

### Parameters

| Name   | Type    | Description | Notes |
| ------ | ------- | ----------- | ----- |
| **id** | **str** |             |

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **404**     | Not found                  | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_get_integration**

> IntegrationsGetIntegration200Response integrations_get_integration(id)

Get Integration

Get an Integration by id

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_get_integration200_response import IntegrationsGetIntegration200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |

    try:
        # Get Integration
        api_response = api_instance.integrations_get_integration(id)
        print("The response of IntegrationsApi->integrations_get_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_get_integration: %s\n" % e)
```

### Parameters

| Name   | Type    | Description | Notes |
| ------ | ------- | ----------- | ----- |
| **id** | **str** |             |

### Return type

[**IntegrationsGetIntegration200Response**](IntegrationsGetIntegration200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **404**     | Not found                  | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_get_integration_events**

> IntegrationsGetIntegrationEvents200Response integrations_get_integration_events(id, since=since, limit=limit)

Get Integration Events

Read the ordered change feed of contract events for an Integration. Pass the returned cursor as `since` to continue. Records are kept for 30 days; an older cursor is rejected with CURSOR_EXPIRED (HTTP 409) and the client must take a new connections snapshot.

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_get_integration_events200_response import IntegrationsGetIntegrationEvents200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |
    since = 'since_example' # str |  (optional)
    limit = 56 # int |  (optional)

    try:
        # Get Integration Events
        api_response = api_instance.integrations_get_integration_events(id, since=since, limit=limit)
        print("The response of IntegrationsApi->integrations_get_integration_events:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_get_integration_events: %s\n" % e)
```

### Parameters

| Name      | Type    | Description | Notes      |
| --------- | ------- | ----------- | ---------- |
| **id**    | **str** |             |
| **since** | **str** |             | [optional] |
| **limit** | **int** |             | [optional] |

### Return type

[**IntegrationsGetIntegrationEvents200Response**](IntegrationsGetIntegrationEvents200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **404**     | Not found                  | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_get_integration_webhook**

> IntegrationsGetIntegrationWebhook200Response integrations_get_integration_webhook(id)

Get Integration Webhook

Read the webhook configuration and delivery health of an Integration: the URL, its state (`active`, `failing` or `disabled`), when the last delivery succeeded and failed, the fixed code of the last failure (for example `http_401`, `timeout`, `network_error`, `redirect` when the endpoint answered with a redirect, which is not followed, or `invalid_webhook` when the address was refused before any request), how many feed records are waiting for a first attempt or for a retry, and the version of the signing secret. The secret itself is never returned.

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_get_integration_webhook200_response import IntegrationsGetIntegrationWebhook200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |

    try:
        # Get Integration Webhook
        api_response = api_instance.integrations_get_integration_webhook(id)
        print("The response of IntegrationsApi->integrations_get_integration_webhook:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_get_integration_webhook: %s\n" % e)
```

### Parameters

| Name   | Type    | Description | Notes |
| ------ | ------- | ----------- | ----- |
| **id** | **str** |             |

### Return type

[**IntegrationsGetIntegrationWebhook200Response**](IntegrationsGetIntegrationWebhook200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **404**     | Not found                  | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_get_integrations**

> IntegrationsGetIntegrations200Response integrations_get_integrations(integrations_get_integrations_request=integrations_get_integrations_request)

Get My Integrations

Get your Integrations with cursor-based pagination

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_get_integrations200_response import IntegrationsGetIntegrations200Response
from openapi_client.models.integrations_get_integrations_request import IntegrationsGetIntegrationsRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    integrations_get_integrations_request = openapi_client.IntegrationsGetIntegrationsRequest() # IntegrationsGetIntegrationsRequest |  (optional)

    try:
        # Get My Integrations
        api_response = api_instance.integrations_get_integrations(integrations_get_integrations_request=integrations_get_integrations_request)
        print("The response of IntegrationsApi->integrations_get_integrations:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_get_integrations: %s\n" % e)
```

### Parameters

| Name                                      | Type                                                                            | Description | Notes      |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ----------- | ---------- |
| **integrations_get_integrations_request** | [**IntegrationsGetIntegrationsRequest**](IntegrationsGetIntegrationsRequest.md) |             | [optional] |

### Return type

[**IntegrationsGetIntegrations200Response**](IntegrationsGetIntegrations200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_rotate_integration_webhook_secret**

> IntegrationsRotateIntegrationWebhookSecret200Response integrations_rotate_integration_webhook_secret(id)

Rotate Integration Webhook Secret

Create a new webhook signing secret for an Integration and return it once. The previous secret stays valid for 24 hours. The first secret is returned by Set Integration Webhook when the webhook URL is first set; a secret cannot be read again later, only replaced here.

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_rotate_integration_webhook_secret200_response import IntegrationsRotateIntegrationWebhookSecret200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |

    try:
        # Rotate Integration Webhook Secret
        api_response = api_instance.integrations_rotate_integration_webhook_secret(id)
        print("The response of IntegrationsApi->integrations_rotate_integration_webhook_secret:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_rotate_integration_webhook_secret: %s\n" % e)
```

### Parameters

| Name   | Type    | Description | Notes |
| ------ | ------- | ----------- | ----- |
| **id** | **str** |             |

### Return type

[**IntegrationsRotateIntegrationWebhookSecret200Response**](IntegrationsRotateIntegrationWebhookSecret200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_send_integration_test_event**

> IntegrationsSendIntegrationTestEvent200Response integrations_send_integration_test_event(id)

Send Integration Test Event

Send one signed `integration.test` event to the webhook URL of an Integration right away and return the result in the same response: `delivered`, the `httpStatus` the receiver answered with, `latencyMs` (only when a request was made, so not for `invalid_webhook` or `no_webhook`), and a fixed `error` code when it was not delivered (`http_<status>`, `timeout`, `network_error`, `redirect` for an endpoint that answered with a redirect (not followed; `httpStatus` is its 3xx code), `invalid_webhook` for an unsafe or invalid address, `no_webhook`). The test event is not written to the change feed. It is sent whenever the Integration has a webhook URL and a signing secret, also while contract events are disabled, so a receiver can be checked before events are enabled. The result also updates the delivery health read by Get Integration Webhook. Limited to 10 test events per Integration per minute; every call counts toward that limit, including calls that end in `no_webhook`, and more are refused with TOO_MANY_REQUESTS. The call is refused with an error when the rate-limit service is unavailable.

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_send_integration_test_event200_response import IntegrationsSendIntegrationTestEvent200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |

    try:
        # Send Integration Test Event
        api_response = api_instance.integrations_send_integration_test_event(id)
        print("The response of IntegrationsApi->integrations_send_integration_test_event:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_send_integration_test_event: %s\n" % e)
```

### Parameters

| Name   | Type    | Description | Notes |
| ------ | ------- | ----------- | ----- |
| **id** | **str** |             |

### Return type

[**IntegrationsSendIntegrationTestEvent200Response**](IntegrationsSendIntegrationTestEvent200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_set_integration_webhook**

> IntegrationsSetIntegrationWebhook200Response integrations_set_integration_webhook(id, integrations_set_integration_webhook_request)

Set Integration Webhook

Set, replace or remove (`null`) the webhook URL that receives signed contract events for an Integration. The first time a URL is set, a signing secret is created and returned once in `secret`; store it then, it cannot be read again. Replacing or removing the URL keeps the existing secret and returns none. Setting a URL also enables contract events if they are not enabled yet.

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_set_integration_webhook200_response import IntegrationsSetIntegrationWebhook200Response
from openapi_client.models.integrations_set_integration_webhook_request import IntegrationsSetIntegrationWebhookRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |
    integrations_set_integration_webhook_request = openapi_client.IntegrationsSetIntegrationWebhookRequest() # IntegrationsSetIntegrationWebhookRequest |

    try:
        # Set Integration Webhook
        api_response = api_instance.integrations_set_integration_webhook(id, integrations_set_integration_webhook_request)
        print("The response of IntegrationsApi->integrations_set_integration_webhook:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_set_integration_webhook: %s\n" % e)
```

### Parameters

| Name                                             | Type                                                                                        | Description | Notes |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------- | ----- |
| **id**                                           | **str**                                                                                     |             |
| **integrations_set_integration_webhook_request** | [**IntegrationsSetIntegrationWebhookRequest**](IntegrationsSetIntegrationWebhookRequest.md) |             |

### Return type

[**IntegrationsSetIntegrationWebhook200Response**](IntegrationsSetIntegrationWebhook200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **integrations_update_integration**

> bool integrations_update_integration(id, integrations_update_integration_request)

Update Integration

Update an Integration by id

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.integrations_update_integration_request import IntegrationsUpdateIntegrationRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to /api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.IntegrationsApi(api_client)
    id = 'id_example' # str |
    integrations_update_integration_request = openapi_client.IntegrationsUpdateIntegrationRequest() # IntegrationsUpdateIntegrationRequest |

    try:
        # Update Integration
        api_response = api_instance.integrations_update_integration(id, integrations_update_integration_request)
        print("The response of IntegrationsApi->integrations_update_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling IntegrationsApi->integrations_update_integration: %s\n" % e)
```

### Parameters

| Name                                        | Type                                                                                | Description | Notes |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | ----------- | ----- |
| **id**                                      | **str**                                                                             |             |
| **integrations_update_integration_request** | [**IntegrationsUpdateIntegrationRequest**](IntegrationsUpdateIntegrationRequest.md) |             |

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                | Response headers |
| ----------- | -------------------------- | ---------------- |
| **200**     | Successful response        | -                |
| **400**     | Invalid input data         | -                |
| **401**     | Authorization not provided | -                |
| **403**     | Insufficient access        | -                |
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
