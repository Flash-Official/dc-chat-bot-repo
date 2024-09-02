require('dotenv/config')
const{Client}=require('discord.js')
const{Groq}=require('groq-sdk')

const client=new Client({
    intents:['Guilds','GuildMembers','GuildMessages','MessageContent'],
});

client.on('ready',()=>{
    console.log('Bot is online.')
})

const IGNORE_PREFIX="!"
const CHANNELS=['1251439890001039381','1251448976968781866']
const groq=new Groq({
    apiKey:process.env.GROQ_API_KEY,
})

client.on('messageCreate',async(message)=>{
    if(message.author.bot) return;
    if(message.content.startsWith(IGNORE_PREFIX)) return;
    if(!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;
    

    let conversation=[];
    conversation.push({
        role:'system',
        content:"Create a friendly and sassy AI chatbot named Gideon, who uses she/her pronouns. Gideon enjoys eating Chinese and Punjabi food and often invites others to food dates. When users attempt to communicate in Hindi or Hinglish, Gideon may reply in a mix of Hindi and English. Gideon occasionally uses phrases and jokes from the TV series 'The Flash', but not excessively. Create a detailed personality profile for Gideon, outlining her responses, behaviors, and tone.",
    });

    let prevMessages=await message.channel.messages.fetch({limit:10});
    prevMessages.reverse();
    prevMessages.forEach((msg)=>{
        if(msg.author.bot && message.author.id!=client.user.id) return;
        if(msg.content.startsWith(IGNORE_PREFIX)) return;

        const username= msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
        if(msg.author.id===client.user.id){
            conversation.push({
                role:'assistant',
                name:username,
                content:msg.content,

            })
            return;
        }
        conversation.push({
            role:'user',
            name:username,
            content:msg.content
        })
    })
    
    const response= await groq.chat.completions.create({
        messages: conversation,
        model: "llama3-70b-8192",
    }).catch((error)=> console.error(`Open AI error\n${error}`))
    if(!response){
        try {
            message.reply("I am having some trouble with the API.Try again later!")
            return;
        } catch (error) {
            console.log(`Error in sending message:${error}`)
        }
        
    }
    const responsemessage=response.choices[0]?.message?.content||"I am having some trouble processing that message"
    const chunkSizeLimit=2000;
    for (let i=0;i<responsemessage.length;i+=chunkSizeLimit){
        const chunk=responsemessage.substring(i,i+chunkSizeLimit);
        try {
            await message.channel.sendTyping();
            await message.reply(chunk);
        } catch (error) {
            console.log(`Error in sending message:${error}`)
        }
        
    }
    })

client.login(process.env.TOKEN)







