# ProfilesApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**profileAcceptConnectionRequest**](ProfilesApi.md#profileAcceptConnectionRequest) | **POST** /profile/{profileId}/accept-connection | Accept Connection Request |
| [**profileBlockProfile**](ProfilesApi.md#profileBlockProfile) | **POST** /profile/{profileId}/block | Block another profile |
| [**profileBlocked**](ProfilesApi.md#profileBlocked) | **GET** /profile/blocked | View blocked profiles |
| [**profileCancelConnectionRequest**](ProfilesApi.md#profileCancelConnectionRequest) | **POST** /profile/{profileId}/cancel-connection-request | Cancel Connection Request |
| [**profileConnectWith**](ProfilesApi.md#profileConnectWith) | **POST** /profile/{profileId}/connect | Connect with another profile |
| [**profileConnectWithInvite**](ProfilesApi.md#profileConnectWithInvite) | **POST** /profile/{profileId}/connect/{challenge} | Connect using an invitation |
| [**profileConnectionRequests**](ProfilesApi.md#profileConnectionRequests) | **GET** /profile/connection-requests | View connection requests |
| [**profileConnections**](ProfilesApi.md#profileConnections) | **GET** /profile/connections | View connections |
| [**profileCreateManagedServiceProfile**](ProfilesApi.md#profileCreateManagedServiceProfile) | **POST** /profile/create-managed-service | Create a managed service profile |
| [**profileCreateProfile**](ProfilesApi.md#profileCreateProfile) | **POST** /profile/create | Create a profile |
| [**profileCreateServiceProfile**](ProfilesApi.md#profileCreateServiceProfile) | **POST** /profile/create-service | Create a service profile |
| [**profileDeleteProfile**](ProfilesApi.md#profileDeleteProfile) | **DELETE** /profile | Delete your profile |
| [**profileDisconnectWith**](ProfilesApi.md#profileDisconnectWith) | **POST** /profile/{profileId}/disconnect | Disconnect with another profile |
| [**profileGenerateInvite**](ProfilesApi.md#profileGenerateInvite) | **POST** /profile/generate-invite | Generate a connection invitation |
| [**profileGetAvailableProfiles**](ProfilesApi.md#profileGetAvailableProfiles) | **POST** /profile/available-profiles | Available Profiles |
| [**profileGetManagedServiceProfiles**](ProfilesApi.md#profileGetManagedServiceProfiles) | **GET** /profile/managed-services | Managed Service Profiles |
| [**profileGetOtherProfile**](ProfilesApi.md#profileGetOtherProfile) | **GET** /profile/{profileId} | Get profile information |
| [**profileGetProfile**](ProfilesApi.md#profileGetProfile) | **GET** /profile | Get your profile information |
| [**profileManagerCreateManagedProfile**](ProfilesApi.md#profileManagerCreateManagedProfile) | **POST** /profile/create-managed-profile | Create a managed profile |
| [**profileManagerGetManagedProfiles**](ProfilesApi.md#profileManagerGetManagedProfiles) | **POST** /profile/managed-profiles | Managed Profiles |
| [**profilePaginatedConnectionRequests**](ProfilesApi.md#profilePaginatedConnectionRequests) | **GET** /profile/connection-requests/paginated | View connection requests |
| [**profilePaginatedConnections**](ProfilesApi.md#profilePaginatedConnections) | **GET** /profile/connections/paginated | View connections |
| [**profilePaginatedPendingConnections**](ProfilesApi.md#profilePaginatedPendingConnections) | **GET** /profile/pending-connections/paginated | View pending connections |
| [**profilePendingConnections**](ProfilesApi.md#profilePendingConnections) | **GET** /profile/pending-connections | View pending connections |
| [**profileRegisterSigningAuthority**](ProfilesApi.md#profileRegisterSigningAuthority) | **POST** /profile/signing-authority/register | Register a Signing Authority |
| [**profileSearchProfiles**](ProfilesApi.md#profileSearchProfiles) | **GET** /search/profiles/{input} | Search profiles |
| [**profileSigningAuthorities**](ProfilesApi.md#profileSigningAuthorities) | **GET** /profile/signing-authority/get/all | Get Signing Authorities for user |
| [**profileSigningAuthority**](ProfilesApi.md#profileSigningAuthority) | **GET** /profile/signing-authority/get | Get Signing Authority for user |
| [**profileUnblockProfile**](ProfilesApi.md#profileUnblockProfile) | **POST** /profile/{profileId}/unblock | Unblock another profile |
| [**profileUpdateProfile**](ProfilesApi.md#profileUpdateProfile) | **POST** /profile | Update your profile |


<a id="profileAcceptConnectionRequest"></a>
# **profileAcceptConnectionRequest**
> Boolean profileAcceptConnectionRequest(profileId)

Accept Connection Request

This route uses the request header to accept a connection request from another user based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    try {
      Boolean result = apiInstance.profileAcceptConnectionRequest(profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileAcceptConnectionRequest");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileBlockProfile"></a>
# **profileBlockProfile**
> Boolean profileBlockProfile(profileId)

Block another profile

Block another user based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    try {
      Boolean result = apiInstance.profileBlockProfile(profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileBlockProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileBlocked"></a>
# **profileBlocked**
> List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt; profileBlocked()

View blocked profiles

This route shows the current user&#39;s blocked profiles

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    try {
      List<BoostGetBoostRecipients200ResponseInnerTo> result = apiInstance.profileBlocked();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileBlocked");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt;**](BoostGetBoostRecipients200ResponseInnerTo.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileCancelConnectionRequest"></a>
# **profileCancelConnectionRequest**
> Boolean profileCancelConnectionRequest(profileId)

Cancel Connection Request

Cancels connection request with another profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    try {
      Boolean result = apiInstance.profileCancelConnectionRequest(profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileCancelConnectionRequest");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileConnectWith"></a>
# **profileConnectWith**
> Boolean profileConnectWith(profileId)

Connect with another profile

This route uses the request header to send a connection request to another user based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    try {
      Boolean result = apiInstance.profileConnectWith(profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileConnectWith");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileConnectWithInvite"></a>
# **profileConnectWithInvite**
> Boolean profileConnectWithInvite(profileId, challenge)

Connect using an invitation

Connects with another profile using an invitation challenge

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    String challenge = "challenge_example"; // String | 
    try {
      Boolean result = apiInstance.profileConnectWithInvite(profileId, challenge);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileConnectWithInvite");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |
| **challenge** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileConnectionRequests"></a>
# **profileConnectionRequests**
> List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt; profileConnectionRequests()

View connection requests

This route shows the current user&#39;s connection requests. Warning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedConnectionRequests instead

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    try {
      List<BoostGetBoostRecipients200ResponseInnerTo> result = apiInstance.profileConnectionRequests();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileConnectionRequests");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt;**](BoostGetBoostRecipients200ResponseInnerTo.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileConnections"></a>
# **profileConnections**
> List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt; profileConnections()

View connections

This route shows the current user&#39;s connections. Warning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedConnections instead!

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    try {
      List<BoostGetBoostRecipients200ResponseInnerTo> result = apiInstance.profileConnections();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileConnections");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt;**](BoostGetBoostRecipients200ResponseInnerTo.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileCreateManagedServiceProfile"></a>
# **profileCreateManagedServiceProfile**
> String profileCreateManagedServiceProfile(profileCreateProfileRequest)

Create a managed service profile

Creates a managed service profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileCreateProfileRequest profileCreateProfileRequest = new ProfileCreateProfileRequest(); // ProfileCreateProfileRequest | 
    try {
      String result = apiInstance.profileCreateManagedServiceProfile(profileCreateProfileRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileCreateManagedServiceProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileCreateProfileRequest** | [**ProfileCreateProfileRequest**](ProfileCreateProfileRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileCreateProfile"></a>
# **profileCreateProfile**
> String profileCreateProfile(profileCreateProfileRequest)

Create a profile

Creates a profile for a user

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileCreateProfileRequest profileCreateProfileRequest = new ProfileCreateProfileRequest(); // ProfileCreateProfileRequest | 
    try {
      String result = apiInstance.profileCreateProfile(profileCreateProfileRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileCreateProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileCreateProfileRequest** | [**ProfileCreateProfileRequest**](ProfileCreateProfileRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileCreateServiceProfile"></a>
# **profileCreateServiceProfile**
> String profileCreateServiceProfile(profileCreateProfileRequest)

Create a service profile

Creates a service profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileCreateProfileRequest profileCreateProfileRequest = new ProfileCreateProfileRequest(); // ProfileCreateProfileRequest | 
    try {
      String result = apiInstance.profileCreateServiceProfile(profileCreateProfileRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileCreateServiceProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileCreateProfileRequest** | [**ProfileCreateProfileRequest**](ProfileCreateProfileRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileDeleteProfile"></a>
# **profileDeleteProfile**
> Boolean profileDeleteProfile()

Delete your profile

This route deletes the profile of the current user

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    try {
      Boolean result = apiInstance.profileDeleteProfile();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileDeleteProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileDisconnectWith"></a>
# **profileDisconnectWith**
> Boolean profileDisconnectWith(profileId)

Disconnect with another profile

This route uses the request header to disconnect with another user based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    try {
      Boolean result = apiInstance.profileDisconnectWith(profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileDisconnectWith");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileGenerateInvite"></a>
# **profileGenerateInvite**
> ProfileGenerateInvite200Response profileGenerateInvite(profileGenerateInviteRequest)

Generate a connection invitation

This route creates a one-time challenge that an unknown profile can use to connect with this account

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileGenerateInviteRequest profileGenerateInviteRequest = new ProfileGenerateInviteRequest(); // ProfileGenerateInviteRequest | 
    try {
      ProfileGenerateInvite200Response result = apiInstance.profileGenerateInvite(profileGenerateInviteRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileGenerateInvite");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileGenerateInviteRequest** | [**ProfileGenerateInviteRequest**](ProfileGenerateInviteRequest.md)|  | [optional] |

### Return type

[**ProfileGenerateInvite200Response**](ProfileGenerateInvite200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileGetAvailableProfiles"></a>
# **profileGetAvailableProfiles**
> ProfileGetAvailableProfiles200Response profileGetAvailableProfiles(profileGetAvailableProfilesRequest)

Available Profiles

This route gets all of your available profiles. That is, profiles you directly or indirectly manage

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileGetAvailableProfilesRequest profileGetAvailableProfilesRequest = new ProfileGetAvailableProfilesRequest(); // ProfileGetAvailableProfilesRequest | 
    try {
      ProfileGetAvailableProfiles200Response result = apiInstance.profileGetAvailableProfiles(profileGetAvailableProfilesRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileGetAvailableProfiles");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileGetAvailableProfilesRequest** | [**ProfileGetAvailableProfilesRequest**](ProfileGetAvailableProfilesRequest.md)|  | [optional] |

### Return type

[**ProfileGetAvailableProfiles200Response**](ProfileGetAvailableProfiles200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileGetManagedServiceProfiles"></a>
# **profileGetManagedServiceProfiles**
> BoostGetBoostAdmins200Response profileGetManagedServiceProfiles(limit, cursor, sort, id)

Managed Service Profiles

This route gets all of your managed service profiles

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    BigDecimal limit = new BigDecimal("25"); // BigDecimal | 
    String cursor = "cursor_example"; // String | 
    String sort = "sort_example"; // String | 
    String id = "id_example"; // String | 
    try {
      BoostGetBoostAdmins200Response result = apiInstance.profileGetManagedServiceProfiles(limit, cursor, sort, id);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileGetManagedServiceProfiles");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **BigDecimal**|  | [optional] [default to 25] |
| **cursor** | **String**|  | [optional] |
| **sort** | **String**|  | [optional] |
| **id** | **String**|  | [optional] |

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="profileGetOtherProfile"></a>
# **profileGetOtherProfile**
> BoostGetBoostRecipients200ResponseInnerTo profileGetOtherProfile(profileId)

Get profile information

This route grabs the profile information of any user, using their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    try {
      BoostGetBoostRecipients200ResponseInnerTo result = apiInstance.profileGetOtherProfile(profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileGetOtherProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |

### Return type

[**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="profileGetProfile"></a>
# **profileGetProfile**
> BoostGetBoostRecipients200ResponseInnerTo profileGetProfile()

Get your profile information

This route uses the request header to grab the profile of the current user

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    try {
      BoostGetBoostRecipients200ResponseInnerTo result = apiInstance.profileGetProfile();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileGetProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileManagerCreateManagedProfile"></a>
# **profileManagerCreateManagedProfile**
> String profileManagerCreateManagedProfile(profileManagerCreateManagedProfileRequest)

Create a managed profile

Creates a managed profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileManagerCreateManagedProfileRequest profileManagerCreateManagedProfileRequest = new ProfileManagerCreateManagedProfileRequest(); // ProfileManagerCreateManagedProfileRequest | 
    try {
      String result = apiInstance.profileManagerCreateManagedProfile(profileManagerCreateManagedProfileRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileManagerCreateManagedProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileManagerCreateManagedProfileRequest** | [**ProfileManagerCreateManagedProfileRequest**](ProfileManagerCreateManagedProfileRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileManagerGetManagedProfiles"></a>
# **profileManagerGetManagedProfiles**
> BoostGetBoostAdmins200Response profileManagerGetManagedProfiles(profileGetAvailableProfilesRequest)

Managed Profiles

This route gets all of your managed profiles

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileGetAvailableProfilesRequest profileGetAvailableProfilesRequest = new ProfileGetAvailableProfilesRequest(); // ProfileGetAvailableProfilesRequest | 
    try {
      BoostGetBoostAdmins200Response result = apiInstance.profileManagerGetManagedProfiles(profileGetAvailableProfilesRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileManagerGetManagedProfiles");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileGetAvailableProfilesRequest** | [**ProfileGetAvailableProfilesRequest**](ProfileGetAvailableProfilesRequest.md)|  | [optional] |

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profilePaginatedConnectionRequests"></a>
# **profilePaginatedConnectionRequests**
> BoostGetBoostAdmins200Response profilePaginatedConnectionRequests(limit, cursor, sort)

View connection requests

This route shows the current user&#39;s connection requests

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    BigDecimal limit = new BigDecimal("25"); // BigDecimal | 
    String cursor = "cursor_example"; // String | 
    String sort = "sort_example"; // String | 
    try {
      BoostGetBoostAdmins200Response result = apiInstance.profilePaginatedConnectionRequests(limit, cursor, sort);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profilePaginatedConnectionRequests");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **BigDecimal**|  | [optional] [default to 25] |
| **cursor** | **String**|  | [optional] |
| **sort** | **String**|  | [optional] |

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="profilePaginatedConnections"></a>
# **profilePaginatedConnections**
> BoostGetBoostAdmins200Response profilePaginatedConnections(limit, cursor, sort)

View connections

This route shows the current user&#39;s connections

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    BigDecimal limit = new BigDecimal("25"); // BigDecimal | 
    String cursor = "cursor_example"; // String | 
    String sort = "sort_example"; // String | 
    try {
      BoostGetBoostAdmins200Response result = apiInstance.profilePaginatedConnections(limit, cursor, sort);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profilePaginatedConnections");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **BigDecimal**|  | [optional] [default to 25] |
| **cursor** | **String**|  | [optional] |
| **sort** | **String**|  | [optional] |

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="profilePaginatedPendingConnections"></a>
# **profilePaginatedPendingConnections**
> BoostGetBoostAdmins200Response profilePaginatedPendingConnections(limit, cursor, sort)

View pending connections

This route shows the current user&#39;s pending connections

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    BigDecimal limit = new BigDecimal("25"); // BigDecimal | 
    String cursor = "cursor_example"; // String | 
    String sort = "sort_example"; // String | 
    try {
      BoostGetBoostAdmins200Response result = apiInstance.profilePaginatedPendingConnections(limit, cursor, sort);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profilePaginatedPendingConnections");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **BigDecimal**|  | [optional] [default to 25] |
| **cursor** | **String**|  | [optional] |
| **sort** | **String**|  | [optional] |

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="profilePendingConnections"></a>
# **profilePendingConnections**
> List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt; profilePendingConnections()

View pending connections

This route shows the current user&#39;s pending connections. Warning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedPendingConnections instead

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    try {
      List<BoostGetBoostRecipients200ResponseInnerTo> result = apiInstance.profilePendingConnections();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profilePendingConnections");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List&lt;BoostGetBoostRecipients200ResponseInnerTo&gt;**](BoostGetBoostRecipients200ResponseInnerTo.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileRegisterSigningAuthority"></a>
# **profileRegisterSigningAuthority**
> Boolean profileRegisterSigningAuthority(profileRegisterSigningAuthorityRequest)

Register a Signing Authority

This route is used to register a signing authority that can sign credentials on the current user&#39;s behalf

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileRegisterSigningAuthorityRequest profileRegisterSigningAuthorityRequest = new ProfileRegisterSigningAuthorityRequest(); // ProfileRegisterSigningAuthorityRequest | 
    try {
      Boolean result = apiInstance.profileRegisterSigningAuthority(profileRegisterSigningAuthorityRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileRegisterSigningAuthority");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileRegisterSigningAuthorityRequest** | [**ProfileRegisterSigningAuthorityRequest**](ProfileRegisterSigningAuthorityRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileSearchProfiles"></a>
# **profileSearchProfiles**
> List&lt;ProfileSearchProfiles200ResponseInner&gt; profileSearchProfiles(input, limit, includeSelf, includeConnectionStatus, includeServiceProfiles)

Search profiles

This route searches for profiles based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String input = "input_example"; // String | 
    Integer limit = 25; // Integer | 
    Boolean includeSelf = false; // Boolean | 
    Boolean includeConnectionStatus = false; // Boolean | 
    Boolean includeServiceProfiles = false; // Boolean | 
    try {
      List<ProfileSearchProfiles200ResponseInner> result = apiInstance.profileSearchProfiles(input, limit, includeSelf, includeConnectionStatus, includeServiceProfiles);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileSearchProfiles");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **input** | **String**|  | |
| **limit** | **Integer**|  | [optional] [default to 25] |
| **includeSelf** | **Boolean**|  | [optional] [default to false] |
| **includeConnectionStatus** | **Boolean**|  | [optional] [default to false] |
| **includeServiceProfiles** | **Boolean**|  | [optional] [default to false] |

### Return type

[**List&lt;ProfileSearchProfiles200ResponseInner&gt;**](ProfileSearchProfiles200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="profileSigningAuthorities"></a>
# **profileSigningAuthorities**
> List&lt;ProfileSigningAuthorities200ResponseInner&gt; profileSigningAuthorities()

Get Signing Authorities for user

This route is used to get registered signing authorities that can sign credentials on the current user&#39;s behalf

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    try {
      List<ProfileSigningAuthorities200ResponseInner> result = apiInstance.profileSigningAuthorities();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileSigningAuthorities");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List&lt;ProfileSigningAuthorities200ResponseInner&gt;**](ProfileSigningAuthorities200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileSigningAuthority"></a>
# **profileSigningAuthority**
> ProfileSigningAuthorities200ResponseInner profileSigningAuthority(endpoint, name)

Get Signing Authority for user

This route is used to get a named signing authority that can sign credentials on the current user&#39;s behalf

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String endpoint = "endpoint_example"; // String | 
    String name = "name_example"; // String | 
    try {
      ProfileSigningAuthorities200ResponseInner result = apiInstance.profileSigningAuthority(endpoint, name);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileSigningAuthority");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **endpoint** | **String**|  | |
| **name** | **String**|  | |

### Return type

[**ProfileSigningAuthorities200ResponseInner**](ProfileSigningAuthorities200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="profileUnblockProfile"></a>
# **profileUnblockProfile**
> Boolean profileUnblockProfile(profileId)

Unblock another profile

Unblock another user based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    try {
      Boolean result = apiInstance.profileUnblockProfile(profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileUnblockProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="profileUpdateProfile"></a>
# **profileUpdateProfile**
> Boolean profileUpdateProfile(profileUpdateProfileRequest)

Update your profile

This route updates the profile of the current user

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfilesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfilesApi apiInstance = new ProfilesApi(defaultClient);
    ProfileUpdateProfileRequest profileUpdateProfileRequest = new ProfileUpdateProfileRequest(); // ProfileUpdateProfileRequest | 
    try {
      Boolean result = apiInstance.profileUpdateProfile(profileUpdateProfileRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfilesApi#profileUpdateProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileUpdateProfileRequest** | [**ProfileUpdateProfileRequest**](ProfileUpdateProfileRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

