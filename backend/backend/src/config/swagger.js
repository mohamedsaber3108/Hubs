'use strict';
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'USAM Hub API',
      version: '1.0.0',
      description: 'Professional Ecosystem for Arab Professionals — REST API Documentation',
      contact: { name: 'USAM Hub', email: 'api@usam.hub', url: 'https://usam.hub' },
      license: { name: 'Private', url: 'https://usam.hub' },
    },
    servers: [
      { url: (process.env.APP_URL || 'http://localhost:3000') + '/api/v1', description: 'Current environment' },
      { url: 'https://api.usam.hub/api/v1', description: 'Production' },
      { url: 'http://localhost:3000/api/v1', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
          description: 'JWT access token from POST /auth/login',
        },
      },
      schemas: {
        // ─── Common ──────────────────────────────────────────────────────────
        ApiResponse: {
          type: 'object',
          properties: {
            success:    { type: 'boolean' },
            message:    { type: 'string' },
            data:       { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success:    { type: 'boolean' },
            data:       { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' }, limit: { type: 'integer' },
                total: { type: 'integer' }, totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' }, hasPrev: { type: 'boolean' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors:  { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
          },
        },
        // ─── User ────────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:             { type: 'integer' },
            uuid:           { type: 'string', format: 'uuid' },
            first_name:     { type: 'string' },
            last_name:      { type: 'string' },
            username:       { type: 'string' },
            email:          { type: 'string', format: 'email' },
            avatar_url:     { type: 'string', nullable: true },
            headline:       { type: 'string', nullable: true },
            bio:            { type: 'string', nullable: true },
            role:           { type: 'string', enum: ['user','moderator','admin'] },
            status:         { type: 'string', enum: ['active','suspended','banned'] },
            email_verified: { type: 'boolean' },
            points_total:   { type: 'integer' },
            followers_count:{ type: 'integer' },
            following_count:{ type: 'integer' },
            created_at:     { type: 'string', format: 'date-time' },
          },
        },
        RegisterRequest: {
          type: 'object', required: ['first_name','last_name','username','email','password'],
          properties: {
            first_name: { type: 'string', minLength: 2 },
            last_name:  { type: 'string', minLength: 2 },
            username:   { type: 'string', minLength: 3, maxLength: 50 },
            email:      { type: 'string', format: 'email' },
            password:   { type: 'string', minLength: 8, description: 'Must include uppercase, lowercase, and number' },
          },
        },
        LoginRequest: {
          type: 'object', required: ['email','password'],
          properties: {
            email:       { type: 'string', format: 'email' },
            password:    { type: 'string' },
            remember_me: { type: 'boolean', default: false },
          },
        },
        // ─── Community ───────────────────────────────────────────────────────
        Community: {
          type: 'object',
          properties: {
            id:           { type: 'integer' },
            slug:         { type: 'string' },
            name:         { type: 'string' },
            emoji:        { type: 'string' },
            tagline:      { type: 'string' },
            description:  { type: 'string' },
            members_count:{ type: 'integer' },
            accent_color: { type: 'string' },
            is_active:    { type: 'boolean' },
          },
        },
        // ─── Post ────────────────────────────────────────────────────────────
        Post: {
          type: 'object',
          properties: {
            id:             { type: 'integer' },
            content:        { type: 'string' },
            type:           { type: 'string', enum: ['text','image','video','poll','link','article'] },
            media_urls:     { type: 'array', items: { type: 'string' } },
            likes_count:    { type: 'integer' },
            comments_count: { type: 'integer' },
            is_pinned:      { type: 'boolean' },
            author:         { $ref: '#/components/schemas/UserMinimal' },
            community:      { $ref: '#/components/schemas/CommunityMinimal' },
            liked:          { type: 'boolean' },
            created_at:     { type: 'string', format: 'date-time' },
          },
        },
        UserMinimal: {
          type: 'object',
          properties: { id: { type: 'integer' }, first_name: { type: 'string' }, last_name: { type: 'string' }, username: { type: 'string' }, avatar_url: { type: 'string', nullable: true } },
        },
        CommunityMinimal: {
          type: 'object',
          properties: { id: { type: 'integer' }, slug: { type: 'string' }, name: { type: 'string' }, emoji: { type: 'string' } },
        },
        // ─── Event ───────────────────────────────────────────────────────────
        Event: {
          type: 'object',
          properties: {
            id:              { type: 'integer' },
            title:           { type: 'string' },
            description:     { type: 'string' },
            type:            { type: 'string', enum: ['online','in_person','hybrid'] },
            status:          { type: 'string', enum: ['draft','published','cancelled','completed'] },
            start_date:      { type: 'string', format: 'date-time' },
            end_date:        { type: 'string', format: 'date-time' },
            location:        { type: 'string', nullable: true },
            meeting_url:     { type: 'string', nullable: true },
            attendees_count: { type: 'integer' },
            max_attendees:   { type: 'integer', nullable: true },
            is_free:         { type: 'boolean' },
            cover_image:     { type: 'string', nullable: true },
          },
        },
        // ─── Challenge ───────────────────────────────────────────────────────
        Challenge: {
          type: 'object',
          properties: {
            id:               { type: 'integer' },
            title:            { type: 'string' },
            description:      { type: 'string' },
            type:             { type: 'string', enum: ['design','code','writing','video','other'] },
            status:           { type: 'string', enum: ['draft','open','voting','completed'] },
            start_date:       { type: 'string', format: 'date-time', nullable: true },
            end_date:         { type: 'string', format: 'date-time', nullable: true },
            prizes:           { type: 'array', items: { type: 'object' } },
            submissions_count:{ type: 'integer' },
            points_reward:    { type: 'integer', nullable: true },
          },
        },
        // ─── Opportunity ─────────────────────────────────────────────────────
        Opportunity: {
          type: 'object',
          properties: {
            id:                  { type: 'integer' },
            title:               { type: 'string' },
            type:                { type: 'string', enum: ['job','internship','freelance','volunteer','scholarship','fellowship','grant','competition'] },
            company:             { type: 'string', nullable: true },
            location_type:       { type: 'string', enum: ['remote','onsite','hybrid'] },
            description:         { type: 'string' },
            requirements:        { type: 'string', nullable: true },
            deadline:            { type: 'string', format: 'date-time', nullable: true },
            applications_count:  { type: 'integer' },
            views_count:         { type: 'integer' },
            status:              { type: 'string', enum: ['open','closed','filled'] },
            is_featured:         { type: 'boolean' },
          },
        },
        // ─── Resource ────────────────────────────────────────────────────────
        Resource: {
          type: 'object',
          properties: {
            id:              { type: 'integer' },
            title:           { type: 'string' },
            description:     { type: 'string' },
            type:            { type: 'string', enum: ['pdf','doc','video','tool','link','course','ebook','template'] },
            file_url:        { type: 'string', nullable: true },
            external_url:    { type: 'string', nullable: true },
            is_free:         { type: 'boolean' },
            avg_rating:      { type: 'number' },
            ratings_count:   { type: 'integer' },
            downloads_count: { type: 'integer' },
          },
        },
        // ─── Group ───────────────────────────────────────────────────────────
        Group: {
          type: 'object',
          properties: {
            id:            { type: 'integer' },
            name:          { type: 'string' },
            description:   { type: 'string', nullable: true },
            visibility:    { type: 'string', enum: ['public','private','invite_only'] },
            members_count: { type: 'integer' },
            cover_image:   { type: 'string', nullable: true },
            tags:          { type: 'array', items: { type: 'string' } },
          },
        },
        // ─── Mentor ──────────────────────────────────────────────────────────
        Mentor: {
          type: 'object',
          properties: {
            id:             { type: 'integer' },
            expertise:      { type: 'string' },
            bio:            { type: 'string', nullable: true },
            is_available:   { type: 'boolean' },
            rating:         { type: 'number' },
            sessions_count: { type: 'integer' },
            price_per_session:{ type: 'number', nullable: true },
            user:           { $ref: '#/components/schemas/UserMinimal' },
          },
        },
        // ─── Message ─────────────────────────────────────────────────────────
        ChatMessage: {
          type: 'object',
          properties: {
            id:              { type: 'integer' },
            conversation_id: { type: 'integer' },
            content:         { type: 'string', nullable: true },
            type:            { type: 'string', enum: ['text','image','file','system'] },
            is_read:         { type: 'boolean' },
            sender:          { $ref: '#/components/schemas/UserMinimal' },
            created_at:      { type: 'string', format: 'date-time' },
          },
        },
      },
      parameters: {
        PageParam:  { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
        LimitParam: { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        SearchParam:{ name: 'search', in: 'query', schema: { type: 'string' } },
      },
      responses: {
        Unauthorized: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        Forbidden:    { description: 'Forbidden',    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        NotFound:     { description: 'Not found',    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        BadRequest:   { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth',          description: 'Authentication — register, login, OAuth, password reset' },
      { name: 'Users',         description: 'User profile, sessions, notifications, follow' },
      { name: 'Communities',   description: 'Community listing and membership' },
      { name: 'Feed',          description: 'Social feed — posts, likes, comments' },
      { name: 'Groups',        description: 'Community groups' },
      { name: 'Events',        description: 'Events and RSVPs' },
      { name: 'Challenges',    description: 'Challenges, submissions, voting' },
      { name: 'Opportunities', description: 'Jobs, internships, freelance, scholarships' },
      { name: 'Resources',     description: 'Learning resources library' },
      { name: 'Leaderboard',   description: 'Points and rankings' },
      { name: 'Mentors',       description: 'Mentorship marketplace' },
      { name: 'Messages',      description: 'Real-time messaging' },
      { name: 'Search',        description: 'Global and community search' },
      { name: 'Onboarding',    description: 'User onboarding flow' },
      { name: 'NomadAI',       description: 'AI career assistant chatbot' },
      { name: 'Admin',         description: 'Admin panel — requires admin JWT' },
      { name: 'System',        description: 'Health checks' },
    ],
  },
  apis: [], // We define everything inline above
};

// Build inline paths
const spec = swaggerJsdoc(options);

// Manually add key paths
spec.paths = spec.paths || {};
const p = spec.paths;

// Auth
p['/auth/register']       = { post:   { tags:['Auth'], summary:'Register',        requestBody: { required:true, content:{'application/json':{schema:{$ref:'#/components/schemas/RegisterRequest'}}} }, responses: { 201:{description:'Registered'}, 400:{$ref:'#/components/responses/BadRequest'}, 409:{description:'Email/username taken'} } } };
p['/auth/login']          = { post:   { tags:['Auth'], summary:'Login',           security:[], requestBody: { required:true, content:{'application/json':{schema:{$ref:'#/components/schemas/LoginRequest'}}} }, responses: { 200:{description:'Login successful, returns access_token'}, 401:{description:'Invalid credentials'} } } };
p['/auth/logout']         = { post:   { tags:['Auth'], summary:'Logout',          responses:{ 200:{description:'Logged out'} } } };
p['/auth/refresh-token']  = { post:   { tags:['Auth'], summary:'Refresh token',   security:[], responses:{ 200:{description:'New access_token'} } } };
p['/auth/forgot-password']= { post:   { tags:['Auth'], summary:'Forgot password', security:[], responses:{ 200:{description:'Reset email sent (always 200)'} } } };
p['/auth/reset-password'] = { post:   { tags:['Auth'], summary:'Reset password',  security:[], responses:{ 200:{description:'Password reset'}, 400:{description:'Invalid/expired token'} } } };
p['/auth/verify-email/{token}'] = { get: { tags:['Auth'], summary:'Verify email', security:[], parameters:[{name:'token',in:'path',required:true,schema:{type:'string'}}], responses:{ 302:{description:'Redirects to frontend'} } } };
p['/auth/google']         = { get:    { tags:['Auth'], summary:'Google OAuth',    security:[], responses:{ 302:{description:'Redirect to Google'} } } };
p['/auth/github']         = { get:    { tags:['Auth'], summary:'GitHub OAuth',    security:[], responses:{ 302:{description:'Redirect to GitHub'} } } };
p['/auth/linkedin']       = { get:    { tags:['Auth'], summary:'LinkedIn OAuth',  security:[], responses:{ 302:{description:'Redirect to LinkedIn'} } } };
p['/auth/facebook']       = { get:    { tags:['Auth'], summary:'Facebook OAuth',  security:[], responses:{ 302:{description:'Redirect to Facebook'} } } };

// Users
p['/users/me']            = { get:  { tags:['Users'], summary:'Get my profile',   responses:{200:{description:'User object with skills/experiences/education'}} }, put: { tags:['Users'], summary:'Update my profile', responses:{200:{}} }, delete: { tags:['Users'], summary:'Delete account', responses:{200:{}} } };
p['/users/me/avatar']     = { post: { tags:['Users'], summary:'Upload avatar',    requestBody:{content:{'multipart/form-data':{schema:{type:'object',properties:{avatar:{type:'string',format:'binary'}}}}}}, responses:{200:{}} } };
p['/users/me/password']   = { put:  { tags:['Users'], summary:'Change password',  responses:{200:{}} } };
p['/users/me/sessions']   = { get:  { tags:['Users'], summary:'List sessions',    responses:{200:{}} } };
p['/users/me/notifications'] = { get: { tags:['Users'], summary:'List notifications', responses:{200:{}} }, delete: { tags:['Users'], summary:'Mark all read', responses:{200:{}} } };
p['/users/{id}/follow']   = { post: { tags:['Users'], summary:'Follow user',      parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} }, delete: { tags:['Users'], summary:'Unfollow user', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} } };
p['/profile/{username}']  = { get:  { tags:['Users'], summary:'Get public profile', security:[], parameters:[{name:'username',in:'path',required:true,schema:{type:'string'}}], responses:{200:{description:'User profile'}, 404:{$ref:'#/components/responses/NotFound'}} } };

// Communities
p['/communities']         = { get:  { tags:['Communities'], summary:'List all communities', security:[], responses:{200:{description:'Communities list'}} } };
p['/communities/{slug}']  = { get:  { tags:['Communities'], summary:'Get community',        security:[], parameters:[{name:'slug',in:'path',required:true,schema:{type:'string'}}], responses:{200:{}, 404:{}} } };
p['/communities/{slug}/join'] = { post: { tags:['Communities'], summary:'Join community', parameters:[{name:'slug',in:'path',required:true,schema:{type:'string'}}], responses:{200:{}} }, delete: { tags:['Communities'], summary:'Leave community', parameters:[{name:'slug',in:'path',required:true,schema:{type:'string'}}], responses:{200:{}} } };

// Posts / Feed
p['/posts']               = { get:  { tags:['Feed'], summary:'Get feed', security:[], parameters:[{$ref:'#/components/parameters/PageParam'},{$ref:'#/components/parameters/LimitParam'},{name:'community',in:'query',schema:{type:'string'}}], responses:{200:{description:'Feed posts'}} }, post: { tags:['Feed'], summary:'Create post', requestBody:{content:{'multipart/form-data':{schema:{type:'object',properties:{content:{type:'string'},type:{type:'string'},community_slug:{type:'string'},media:{type:'array',items:{type:'string',format:'binary'}}}}}}}, responses:{201:{}} } };
p['/posts/{id}']          = { get:  { tags:['Feed'], summary:'Get post',    security:[], parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{},404:{}} }, put: { tags:['Feed'], summary:'Update post', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} }, delete: { tags:['Feed'], summary:'Delete post', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} } };
p['/posts/{id}/like']     = { post: { tags:['Feed'], summary:'Like/Unlike post', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{description:'liked: true/false'}} } };
p['/posts/{id}/comments'] = { post: { tags:['Feed'], summary:'Add comment', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['content'],properties:{content:{type:'string'},parent_id:{type:'integer',nullable:true}}}}}}, responses:{201:{}} } };

// Groups
p['/groups']              = { get: { tags:['Groups'], summary:'List groups', security:[], parameters:[{$ref:'#/components/parameters/PageParam'},{name:'community',in:'query',schema:{type:'string'}},{name:'type',in:'query',schema:{type:'string',enum:['all','public','private']}},{$ref:'#/components/parameters/SearchParam'}], responses:{200:{}} }, post: { tags:['Groups'], summary:'Create group', requestBody:{content:{'multipart/form-data':{schema:{type:'object',required:['name','community_slug'],properties:{name:{type:'string'},description:{type:'string'},community_slug:{type:'string'},visibility:{type:'string'},cover_image:{type:'string',format:'binary'}}}}}}, responses:{201:{}} } };
p['/groups/{id}/join']    = { post: { tags:['Groups'], summary:'Join/request group', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} }, delete: { tags:['Groups'], summary:'Leave group', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} } };

// Events
p['/events']              = { get: { tags:['Events'], summary:'List events', security:[], parameters:[{$ref:'#/components/parameters/PageParam'},{name:'community',in:'query',schema:{type:'string'}},{name:'upcoming',in:'query',schema:{type:'boolean'}}], responses:{200:{}} }, post: { tags:['Events'], summary:'Create event', responses:{201:{}} } };
p['/events/{id}/rsvp']    = { post: { tags:['Events'], summary:'RSVP to event', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{status:{type:'string',enum:['going','maybe','not_going']}}}}}}, responses:{200:{}} } };

// Challenges
p['/challenges']          = { get: { tags:['Challenges'], summary:'List challenges', security:[], parameters:[{$ref:'#/components/parameters/PageParam'},{name:'community',in:'query',schema:{type:'string'}},{name:'type',in:'query',schema:{type:'string'}},{name:'status',in:'query',schema:{type:'string'}}], responses:{200:{}} } };
p['/challenges/{id}/submit'] = { post: { tags:['Challenges'], summary:'Submit challenge entry', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], requestBody:{content:{'multipart/form-data':{schema:{type:'object',required:['title','description'],properties:{title:{type:'string'},description:{type:'string'},content_url:{type:'string'},media:{type:'array',items:{type:'string',format:'binary'}}}}}}}, responses:{201:{}} } };
p['/challenges/submissions/{submissionId}/vote'] = { post: { tags:['Challenges'], summary:'Vote on submission', parameters:[{name:'submissionId',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} } };

// Opportunities
p['/opportunities']       = { get: { tags:['Opportunities'], summary:'List opportunities', security:[], parameters:[{$ref:'#/components/parameters/PageParam'},{name:'type',in:'query',schema:{type:'string'}},{name:'community',in:'query',schema:{type:'string'}},{$ref:'#/components/parameters/SearchParam'}], responses:{200:{}} }, post: { tags:['Opportunities'], summary:'Post opportunity', responses:{201:{}} } };
p['/opportunities/{id}/apply'] = { post: { tags:['Opportunities'], summary:'Apply to opportunity', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], requestBody:{content:{'multipart/form-data':{schema:{type:'object',properties:{cover_letter:{type:'string'},resume:{type:'string',format:'binary'}}}}}}, responses:{201:{}} } };
p['/opportunities/{id}/save']  = { post: { tags:['Opportunities'], summary:'Save/unsave opportunity', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{description:'saved: true/false'}} } };

// Resources
p['/resources']           = { get: { tags:['Resources'], summary:'List resources', security:[], parameters:[{$ref:'#/components/parameters/PageParam'},{name:'type',in:'query',schema:{type:'string'}},{name:'community',in:'query',schema:{type:'string'}}], responses:{200:{}} }, post: { tags:['Resources'], summary:'Upload resource', requestBody:{content:{'multipart/form-data':{schema:{type:'object',properties:{title:{type:'string'},description:{type:'string'},type:{type:'string'},community_slug:{type:'string'},file:{type:'string',format:'binary'}}}}}}, responses:{201:{}} } };
p['/resources/{id}/rate'] = { post: { tags:['Resources'], summary:'Rate resource', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['rating'],properties:{rating:{type:'integer',minimum:1,maximum:5},review:{type:'string'}}}}}}, responses:{200:{}} } };

// Leaderboard
p['/leaderboard']         = { get: { tags:['Leaderboard'], summary:'Get leaderboard', security:[], parameters:[{name:'period',in:'query',schema:{type:'string',enum:['all_time','month','week']}},{name:'community',in:'query',schema:{type:'string'}},{$ref:'#/components/parameters/PageParam'}], responses:{200:{description:'Ranked user list'}} } };
p['/leaderboard/me']      = { get: { tags:['Leaderboard'], summary:'My rank and stats',  responses:{200:{}} } };
p['/leaderboard/history'] = { get: { tags:['Leaderboard'], summary:'Point history',      responses:{200:{}} } };

// Mentors
p['/mentors']             = { get: { tags:['Mentors'], summary:'List mentors', security:[], parameters:[{$ref:'#/components/parameters/PageParam'},{name:'community',in:'query',schema:{type:'string'}},{name:'expertise',in:'query',schema:{type:'string'}}], responses:{200:{}} }, post: { tags:['Mentors'], summary:'Become a mentor', responses:{201:{}} } };
p['/mentors/{id}/request'] = { post: { tags:['Mentors'], summary:'Request mentorship session', parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}], requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['topic'],properties:{topic:{type:'string'},message:{type:'string'},session_type:{type:'string',enum:['video','audio','text']}}}}}}, responses:{201:{}} } };
p['/mentors/requests']    = { get: { tags:['Mentors'], summary:'My mentor requests', parameters:[{name:'type',in:'query',schema:{type:'string',enum:['all','incoming','outgoing']}}], responses:{200:{}} } };

// Messages
p['/messages']            = { get: { tags:['Messages'], summary:'List conversations', responses:{200:{}} }, post: { tags:['Messages'], summary:'Start or find conversation', requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['user_id','message'],properties:{user_id:{type:'integer'},message:{type:'string'}}}}}}, responses:{201:{}} } };
p['/messages/{conversationId}'] = { get: { tags:['Messages'], summary:'Get messages', parameters:[{name:'conversationId',in:'path',required:true,schema:{type:'integer'}}], responses:{200:{}} }, post: { tags:['Messages'], summary:'Send message', parameters:[{name:'conversationId',in:'path',required:true,schema:{type:'integer'}}], requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['content'],properties:{content:{type:'string'},type:{type:'string',enum:['text','image','file']}}}}}}, responses:{201:{}} } };

// Search
p['/search']              = { get: { tags:['Search'], summary:'Global search', security:[], parameters:[{name:'q',in:'query',required:true,schema:{type:'string',minLength:2}},{name:'type',in:'query',schema:{type:'string',enum:['all','users','posts','events','groups','challenges','opportunities','resources','mentors']}},{name:'limit',in:'query',schema:{type:'integer',default:5}}], responses:{200:{description:'Search results by category'}} } };

// Onboarding
p['/onboarding']          = { get: { tags:['Onboarding'], summary:'Get onboarding status', responses:{200:{}} }, post: { tags:['Onboarding'], summary:'Submit onboarding', requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{communities:{type:'array',items:{type:'string'}},role:{type:'string'},goals:{type:'array',items:{type:'string'}},skills:{type:'array',items:{type:'string'}},headline:{type:'string'},bio:{type:'string'}}}}}}, responses:{200:{}} } };

// NomadAI
p['/nomad/chat']          = { post: { tags:['NomadAI'], summary:'Chat with NomadAI', requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['message'],properties:{message:{type:'string'},history:{type:'array',items:{type:'object',properties:{role:{type:'string',enum:['user','assistant']},content:{type:'string'}}}},community:{type:'string'}}}}}}, responses:{200:{description:'AI reply'}} } };

// Health
p['/health']              = { get: { tags:['System'], summary:'Health check', security:[], responses:{200:{description:'API healthy'},503:{description:'Degraded'}} } };

// Admin — key endpoints documented
p['/admin/auth/login']    = { post: { tags:['Admin'], summary:'Admin login',     security:[], requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['email','password'],properties:{email:{type:'string'},password:{type:'string'},totp_code:{type:'string'}}}}}}, responses:{200:{description:'Admin token'}, 401:{description:'Invalid credentials'}} } };
p['/admin/dashboard/stats'] = { get: { tags:['Admin'], summary:'Dashboard KPIs', responses:{200:{description:'Users, content, community stats'}} } };
p['/admin/users']           = { get: { tags:['Admin'], summary:'List users',      parameters:[{$ref:'#/components/parameters/SearchParam'},{name:'role',in:'query',schema:{type:'string'}},{name:'status',in:'query',schema:{type:'string'}}], responses:{200:{}} } };
p['/admin/system/health']   = { get: { tags:['Admin'], summary:'System health',   responses:{200:{description:'DB, Redis, queue status'}} } };

module.exports = spec;
