# openapi_client.CredentialSharePreviewsApi

All URIs are relative to _/api_

| Method                                                                                                   | HTTP request                                    | Description                           |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| [**credential_share_previews_delete**](CredentialSharePreviewsApi.md#credential_share_previews_delete)   | **POST** /credential-share-previews/{id}/delete | Delete owned credential share preview |
| [**credential_share_previews_get**](CredentialSharePreviewsApi.md#credential_share_previews_get)         | **GET** /credential-share-previews/{id}         | Get public credential share preview   |
| [**credential_share_previews_publish**](CredentialSharePreviewsApi.md#credential_share_previews_publish) | **POST** /credential-share-previews             | Publish credential share preview      |

# **credential_share_previews_delete**

> bool credential_share_previews_delete(id)

Delete owned credential share preview

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
    api_instance = openapi_client.CredentialSharePreviewsApi(api_client)
    id = UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d') # UUID |

    try:
        # Delete owned credential share preview
        api_response = api_instance.credential_share_previews_delete(id)
        print("The response of CredentialSharePreviewsApi->credential_share_previews_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialSharePreviewsApi->credential_share_previews_delete: %s\n" % e)
```

### Parameters

| Name   | Type     | Description | Notes |
| ------ | -------- | ----------- | ----- |
| **id** | **UUID** |             |

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
| **500**     | Internal server error      | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **credential_share_previews_get**

> CredentialSharePreviewsGet200Response credential_share_previews_get(id, share_uri)

Get public credential share preview

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_share_previews_get200_response import CredentialSharePreviewsGet200Response
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
    api_instance = openapi_client.CredentialSharePreviewsApi(api_client)
    id = UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d') # UUID |
    share_uri = 'share_uri_example' # str |

    try:
        # Get public credential share preview
        api_response = api_instance.credential_share_previews_get(id, share_uri)
        print("The response of CredentialSharePreviewsApi->credential_share_previews_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialSharePreviewsApi->credential_share_previews_get: %s\n" % e)
```

### Parameters

| Name          | Type     | Description | Notes |
| ------------- | -------- | ----------- | ----- |
| **id**        | **UUID** |             |
| **share_uri** | **str**  |             |

### Return type

[**CredentialSharePreviewsGet200Response**](CredentialSharePreviewsGet200Response.md)

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

# **credential_share_previews_publish**

> UUID credential_share_previews_publish(credential_share_previews_publish_request)

Publish credential share preview

### Example

- Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_share_previews_publish_request import CredentialSharePreviewsPublishRequest
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
    api_instance = openapi_client.CredentialSharePreviewsApi(api_client)
    credential_share_previews_publish_request = openapi_client.CredentialSharePreviewsPublishRequest() # CredentialSharePreviewsPublishRequest |

    try:
        # Publish credential share preview
        api_response = api_instance.credential_share_previews_publish(credential_share_previews_publish_request)
        print("The response of CredentialSharePreviewsApi->credential_share_previews_publish:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialSharePreviewsApi->credential_share_previews_publish: %s\n" % e)
```

### Parameters

| Name                                          | Type                                                                                  | Description | Notes |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- | ----- |
| **credential_share_previews_publish_request** | [**CredentialSharePreviewsPublishRequest**](CredentialSharePreviewsPublishRequest.md) |             |

### Return type

**UUID**

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
